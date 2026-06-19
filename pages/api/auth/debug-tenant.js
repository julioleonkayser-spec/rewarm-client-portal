// Temporary diagnostic endpoint. Remove once tenant isolation is confirmed working.
// Access: GET /api/auth/debug-tenant  with  Authorization: Bearer <SESSION_SECRET>

export default function handler(req, res) {
  const secret = process.env.SESSION_SECRET;
  const provided = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tenantMapRaw = process.env.TENANT_MAP;
  const multiTenant = process.env.MULTI_TENANT;
  const globalSheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_ID || null;

  let parseOk = false;
  let parseError = null;
  let entries = null;

  if (tenantMapRaw) {
    try {
      let parsed = JSON.parse(tenantMapRaw);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('root must be a JSON object, got ' + typeof parsed);
      }
      parseOk = true;
      entries = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [
          k,
          {
            tenantId: v?.tenantId ?? null,
            plan: v?.plan ?? null,
            controlSheetIdSet: !!(v?.controlSheetId),
            controlSheetIdPrefix: v?.controlSheetId ? String(v.controlSheetId).slice(0, 8) : null,
            sameAsGlobal: v?.controlSheetId === globalSheetId,
          },
        ])
      );
    } catch (e) {
      parseError = e.message;
    }
  }

  return res.status(200).json({
    MULTI_TENANT: multiTenant,
    TENANT_MAP_SET: !!tenantMapRaw,
    TENANT_MAP_RAW_LENGTH: tenantMapRaw?.length ?? 0,
    TENANT_MAP_FIRST_CHARS: tenantMapRaw ? JSON.stringify(tenantMapRaw.slice(0, 30)) : null,
    parseOk,
    parseError,
    entries,
    globalSheetIdPrefix: globalSheetId ? globalSheetId.slice(0, 8) : null,
  });
}
