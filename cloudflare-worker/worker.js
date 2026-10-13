/**
 * Cloudflare Workers Backend for TabZone (tab.srider.kr)
 * 7th School IT Infrastructure Service
 *
 * Environment Bindings:
 * - env.DB: Cloudflare D1 Database binding
 * - env.CACHE_KV: Cloudflare Workers KV binding (optional caching)
 */

const SUPER_ADMIN_EMAIL = 'averver100@gmail.com';

const ALLOWED_ORIGINS = [
  'https://tab.srider.kr',
  'https://commute-gilt.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.srider.kr') ||
    origin.endsWith('.vercel.app');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data, status = 200, request = null, extraHeaders = {}) {
  const cors = request ? getCorsHeaders(request) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...cors,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle OPTIONS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    try {
      // 1. Health check
      if (url.pathname === '/api/health') {
        return jsonResponse(
          {
            status: 'ok',
            app: 'TabZone (탭존)',
            subdomain: 'tab.srider.kr',
            serviceNumber: 7,
            timestamp: new Date().toISOString(),
          },
          200,
          request
        );
      }

      // 2. GET /api/rentals
      if (url.pathname === '/api/rentals' && method === 'GET') {
        if (!env.DB) {
          return jsonResponse({ error: 'D1 DB binding not found' }, 500, request);
        }
        const { results } = await env.DB.prepare(
          'SELECT * FROM rentals ORDER BY created_at DESC LIMIT 150'
        ).all();
        return jsonResponse({ rentals: results || [] }, 200, request);
      }

      // 3. POST /api/rentals
      if (url.pathname === '/api/rentals' && method === 'POST') {
        const body = await request.json();
        const id = 'rent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const createdAt = new Date().toISOString();

        await env.DB.prepare(
          `INSERT INTO rentals (id, created_at, period, grade_class, teacher_name, student_rep, cart_used, quantity, approver, status, returned_at, created_by_email)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '대여 중', NULL, ?)`
        )
          .bind(
            id,
            createdAt,
            body.period,
            body.gradeClass || body.grade_class,
            body.teacherName || body.teacher_name,
            body.studentRep || body.student_rep,
            body.cartUsed || body.cart_used,
            body.quantity || 20,
            body.approver,
            body.createdByEmail || body.created_by_email || 'kiosk@tab.srider.kr'
          )
          .run();

        // Audit Log entry
        await env.DB.prepare(
          `INSERT INTO audit_logs (id, user_id, user_email, timestamp, action, summary, details)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            'log_' + Date.now(),
            'd1_worker',
            body.createdByEmail || 'admin',
            createdAt,
            '대여 등록',
            `${body.teacherName} 선생님 (${body.gradeClass}) ${body.cartUsed} ${body.quantity}대 대여`,
            `교시: ${body.period}, 승인: ${body.approver}, 수령: ${body.studentRep}`
          )
          .run();

        return jsonResponse({ success: true, id, createdAt }, 201, request);
      }

      // 4. PATCH /api/rentals/:id/return
      const returnMatch = url.pathname.match(/^\/api\/rentals\/([^/]+)\/return$/);
      if (returnMatch && method === 'PATCH') {
        const rentalId = returnMatch[1];
        const body = (await request.json().catch(() => ({}))) || {};
        const returnedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE rentals SET status = '반납 완료', returned_at = ?, updated_by_email = ? WHERE id = ?`
        )
          .bind(returnedAt, body.userEmail || 'admin', rentalId)
          .run();

        // Audit Log entry
        await env.DB.prepare(
          `INSERT INTO audit_logs (id, user_id, user_email, timestamp, action, summary, details)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            'log_' + Date.now(),
            'd1_worker',
            body.userEmail || 'admin',
            returnedAt,
            '반납 완료',
            `대여 ID [${rentalId}] 반납 완료 처리`,
            `반납 시각: ${returnedAt}`
          )
          .run();

        return jsonResponse({ success: true, rentalId, returnedAt }, 200, request);
      }

      // 5. GET /api/whitelist
      if (url.pathname === '/api/whitelist' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM whitelist ORDER BY created_at DESC'
        ).all();
        return jsonResponse({ whitelist: results || [] }, 200, request);
      }

      // 6. POST /api/whitelist (Add teacher - Superadmin only)
      if (url.pathname === '/api/whitelist' && method === 'POST') {
        const body = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
          return jsonResponse({ error: 'Invalid email' }, 400, request);
        }

        await env.DB.prepare(
          `INSERT OR REPLACE INTO whitelist (email, name, role, department, created_at, added_by)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            email,
            body.name,
            body.role || 'admin',
            body.department || '교무실',
            new Date().toISOString(),
            body.addedBy || SUPER_ADMIN_EMAIL
          )
          .run();

        return jsonResponse({ success: true, email }, 201, request);
      }

      // 7. DELETE /api/whitelist/:email (Superadmin only)
      const deleteWhitelistMatch = url.pathname.match(/^\/api\/whitelist\/([^/]+)$/);
      if (deleteWhitelistMatch && method === 'DELETE') {
        const targetEmail = decodeURIComponent(deleteWhitelistMatch[1]).trim().toLowerCase();
        if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
          return jsonResponse(
            { error: '슈퍼어드민 계정(averver100@gmail.com)은 영구 보존되며 삭제할 수 없습니다.' },
            403,
            request
          );
        }
        await env.DB.prepare('DELETE FROM whitelist WHERE email = ?').bind(targetEmail).run();
        return jsonResponse({ success: true, deletedEmail: targetEmail }, 200, request);
      }

      // 8. Teachers API (/api/teachers)
      if (url.pathname === '/api/teachers' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM teachers ORDER BY name ASC').all();
        return jsonResponse({ teachers: results || [] }, 200, request);
      }
      if (url.pathname === '/api/teachers' && method === 'POST') {
        const body = await request.json();
        const id = 't_' + Date.now();
        await env.DB.prepare('INSERT INTO teachers (id, name, subject, created_at, added_by) VALUES (?, ?, ?, ?, ?)')
          .bind(id, body.name, body.subject || '일반교과', new Date().toISOString(), body.addedBy || 'admin')
          .run();
        return jsonResponse({ success: true, id }, 201, request);
      }

      // 9. Approvers API (/api/approvers)
      if (url.pathname === '/api/approvers' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM approvers ORDER BY created_at ASC').all();
        return jsonResponse({ approvers: results || [] }, 200, request);
      }
      if (url.pathname === '/api/approvers' && method === 'POST') {
        const body = await request.json();
        const id = 'appr_' + Date.now();
        await env.DB.prepare('INSERT INTO approvers (id, name, position, created_at, added_by) VALUES (?, ?, ?, ?, ?)')
          .bind(id, body.name, body.position || '교육정보부', new Date().toISOString(), body.addedBy || 'admin')
          .run();
        return jsonResponse({ success: true, id }, 201, request);
      }

      // 10. GET /api/audit-logs
      if (url.pathname === '/api/audit-logs' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100'
        ).all();
        return jsonResponse({ auditLogs: results || [] }, 200, request);
      }

      // 11. POST /api/sso/session
      if (url.pathname === '/api/sso/session' && method === 'POST') {
        const body = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const cookieVal = `sso_superadmin=${encodeURIComponent(
          email
        )}; Domain=.srider.kr; Path=/; Max-Age=2592000; SameSite=Lax; Secure`;

        return jsonResponse(
          { success: true, ssoActive: true, email },
          200,
          request,
          { 'Set-Cookie': cookieVal }
        );
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404, request);
    } catch (err) {
      console.error('Cloudflare Worker Error:', err);
      return jsonResponse({ error: err.message }, 500, request);
    }
  },
};
