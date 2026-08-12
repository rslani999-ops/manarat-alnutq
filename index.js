const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=utf-8"}});
export default{async fetch(r,e){
 const u=new URL(r.url);
 if(u.pathname==="/api/health")return json({ok:true,app:"منارة النطق",version:"1.1"});
 if(u.pathname==="/api/ai"){
  if(r.method!=="POST")return json({error:"استخدم POST"},405);
  if(!e.AI)return json({error:"Workers AI غير مفعّل بعد"},503);
  try{
   const b=await r.json(), role=b.role==="student"?"طفل من 4 إلى 12 سنة":"معلم تدريبات نطق";
   const p=`أنت مساعد تعليمي للنطق العربي للأطفال 4-12 سنة. لا تقدم تشخيصا طبيا.
الجمهور: ${role}
الطالب: ${b.studentName||"الطالب"}
الحرف: ${b.letter||""}
المرحلة: ${b.stage||""}
النتائج: ${JSON.stringify(b.results||{})}
أعط: ملاحظة أداء، تمرينا قصيرا، ونصيحة مناسبة للجمهور. بالعربية وبأسلوب عملي وآمن.`;
   const x=await e.AI.run("@cf/meta/llama-3.1-8b-instruct",{prompt:p,max_tokens:500});
   return json({ok:true,recommendation:x?.response||x});
  }catch(x){return json({error:"تعذر تشغيل المساعد الذكي",detail:String(x?.message||x)},500)}
 }
 const h=await e.ASSETS.fetch(r);
 return h;
}};
