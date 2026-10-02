(function(){
  'use strict';
  var catalog={
    gemini:{name:'Gemini',base:'https://generativelanguage.googleapis.com/v1beta',models:['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash','gemini-3.5-flash','gemini-3.5-flash-lite'],docs:'https://ai.google.dev/gemini-api/docs/models',note:'Các model sinh văn bản/mã. Có thể nhập Gemini Pro hoặc model khác bên dưới.'},
    openai:{name:'ChatGPT / OpenAI',base:'https://api.openai.com/v1',models:['gpt-6.1-sol','gpt-6-astra','gpt-6-luna','gpt-6-sol','gpt-5.6-sol'],docs:'https://developers.openai.com/api/docs/models',note:'Sử dụng OpenAI API (Responses). Quyền truy cập model phụ thuộc tài khoản API.'},
    claude:{name:'Claude',base:'https://api.anthropic.com/v1',models:['claude-sonnet-5-5','claude-opus-5-5','claude-fable-5-1','claude-haiku-4-5','claude-sonnet-5'],docs:'https://platform.claude.com/docs/en/models/overview',note:'Sonnet 5 là bản trước; các model còn lại thuộc danh sách hiện hành.'},
    deepseek:{name:'DeepSeek',base:'https://api.deepseek.com',models:['deepseek-flash','deepseek-v4-pro','deepseek-v4-flash','deepseek-v4-flash-vision-exp'],docs:'https://api-docs.deepseek.com/quick_start/pricing-details-cny/',note:'Có 2 model API hiện hành. Hai tên v4-flash là alias tương thích, cùng chuyển tới V4.1 Flash; không phải hai model mới.'}
  };
  function defaults(){var providers={};Object.keys(catalog).forEach(function(id){providers[id]={base:catalog[id].base,model:catalog[id].models[0],hasKey:false};});return {active:'gemini',providers:providers};}
  async function read(){if(!API.chayThu)return (await Kho.api('docAI')).ai;var config=defaults();try{var saved=JSON.parse(localStorage.getItem('mtkweb_ai_demo')||'null');if(saved){config.active=saved.active||config.active;Object.keys(catalog).forEach(function(id){if(saved.providers&&saved.providers[id])config.providers[id]={base:saved.providers[id].base,model:saved.providers[id].model,hasKey:false};});}}catch(e){}return config;}
  async function save(data){if(!API.chayThu)return (await Kho.api('luuAI',data)).ai;var c=await read();if(data.active)c.active=data.active;else{if(data.key)throw Error('Chưa sẵn sàng lưu API key.');c.providers[data.provider]={base:data.base,model:data.model,hasKey:false};}localStorage.setItem('mtkweb_ai_demo',JSON.stringify(c));return c;}
  window.AIUI={catalog:catalog,read:read,save:save,defaults:defaults};
})();
