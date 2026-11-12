'use strict';
const {root, key, query, send, admin} = require('../lib/core');
const initial = require('../lib/key-visual-initial.json');
const endpoint = '/rest/v1/key_visual?id=eq.1';
module.exports = async (req, res) => {
  try {
    if (root() !== 'https://qrbavxempotptnmflqoq.supabase.co') return send(res, 503, {error:'테스트 저장소 연결을 확인해 주세요.'});
    if (req.method === 'GET') {
      const token = req.query?.admin === '1' ? await admin(req) : undefined;
      const columns = token ? 'slides,revision,originals' : 'slides,revision';
      const [row] = await query(endpoint + '&select=' + columns,'GET',undefined,token);
      if (!row) return send(res, 200, {slides:initial,revision:0});
      const slides = token ? row.slides.map((item,i)=>({...item,original:row.originals[i] || undefined})) : row.slides;
      return send(res, 200, {slides,revision:row.revision});
    }
    if (req.method !== 'PUT') return send(res, 405, {error:'지원하지 않는 요청입니다.'});
    const token = await admin(req);
    const {slides, revision} = req.body || {};
    const prefix = root() + '/storage/v1/object/public/key-visual/';
    const isUpload = value => typeof value === 'string' && value.startsWith(prefix) &&
      /^[a-f0-9-]{36}\.(webp|png)$/.test(value.slice(prefix.length));
    const isAsset = value => initial.some(item => item.desktop === value) || isUpload(value);
    if (!Number.isInteger(revision) || revision < 0) {
      return send(res, 400, {error:'공개 목록 버전이 올바르지 않습니다.'});
    }
    if (!Array.isArray(slides) || slides.length < 1 || slides.length > 10) {
      return send(res, 400, {error:'사진은 1~10장까지 반영할 수 있습니다.'});
    }
    if (!slides.every(item => item && isAsset(item.desktop) && isAsset(item.mobile))) {
      return send(res, 400, {error:'PC용 또는 모바일용 사진 주소가 올바르지 않습니다.'});
    }
    const isCrop = values => Array.isArray(values) && values.length === 3 &&
      values.every((value,i)=>Number.isFinite(value) && value >= (i===2?25:0) && value <= 100);
    const isOriginal = original => original && typeof original.name === 'string' &&
      /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.test(original.name) &&
      isCrop(original.desktop) && isCrop(original.mobile);
    if (!slides.every(item => item.original === undefined || isOriginal(item.original))) {
      return send(res, 400, {error:'비공개 원본 또는 크롭 정보가 올바르지 않습니다.'});
    }
    const originals = slides.map(({original})=>original ? {name:original.name,desktop:original.desktop,mobile:original.mobile} : null);
    const payload = {originals,slides:slides.map(({desktop,mobile,alt})=>({desktop,mobile,alt:typeof alt === 'string' ? alt.trim().slice(0,150) : ''})),revision:revision+1};
    const files = [...new Set(payload.slides.flatMap(item => [item.desktop,item.mobile]).filter(isUpload))];
    const checks = await Promise.all(files.map(url => fetch(url,{method:'HEAD'})));
    if (checks.some(response => !response.ok)) return send(res, 400, {error:'등록한 사진 파일을 확인할 수 없습니다.'});
    const rows = revision === 0
      ? await query('/rest/v1/key_visual?select=revision','POST',{id:1,...payload},token)
      : await query(endpoint+'&revision=eq.'+revision+'&select=revision','PATCH',payload,token);
    if (!rows.length) return send(res, 409, {error:'공개 목록이 바뀌었습니다. 다시 열어 확인해 주세요.'});
    return send(res, 200, rows[0]);
  } catch (error) {
    const status = error.status || 500;
    return send(res, status, {error:status===409?'공개 목록이 바뀌었습니다. 다시 열어 확인해 주세요.':status>=500?'Key Visual 저장소에 연결할 수 없습니다.':error.message});
  }
};
