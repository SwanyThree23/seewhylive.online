'use strict';
var express=require('express'), https=require('https'), router=express.Router();
var SB='rxlgywvfclyjdfyvfvyc.supabase.co';
function sb(method,path,body,cb){
  var key=process.env.SUPABASE_SERVICE_ROLE_KEY, payload=body?JSON.stringify(body):null;
  var opts={hostname:SB,port:443,path:path,method:method,headers:{'apikey':key,'Content-Type':'application/json','Prefer':'return=representation'}};
  if(payload) opts.headers['Content-Length']=Buffer.byteLength(payload);
  var req=https.request(opts,function(res){var c=[];res.on('data',function(d){c.push(d);});res.on('end',function(){var raw=Buffer.concat(c).toString();var p=null;try{p=JSON.parse(raw);}catch(e){p=raw;}cb(null,res.statusCode,p);});});
  req.on('error',function(e){cb(e);});
  if(payload) req.write(payload);
  req.end();
}
router.post('/start',function(req,res){
  var b=req.body||{};
  if(!b.stream_id||!b.creator_id) return res.status(400).json({error:'stream_id and creator_id required'});
  sb('POST','/rest/v1/vods',{stream_id:b.stream_id,creator_id:b.creator_id,title:b.title||'Live Recording',storage_path:'pending/'+b.stream_id+'/'+Date.now(),is_public:false,view_count:0},function(err,status,data){
    if(err) return res.status(500).json({error:'DB error'});
    if(status>=400) return res.status(status).json({error:'Supabase error',detail:data});
    return res.json(Array.isArray(data)?data[0]:data);
  });
});
router.post('/stop',function(req,res){
  var b=req.body||{};
  if(!b.vod_id) return res.status(400).json({error:'vod_id required'});
  var patch={duration_seconds:Math.floor(b.duration_seconds||0),is_public:true};
  if(b.playback_url) patch.playback_url=b.playback_url;
  sb('PATCH','/rest/v1/vods?id=eq.'+encodeURIComponent(b.vod_id),patch,function(err,status,data){
    if(err) return res.status(500).json({error:'DB error'});
    if(status>=400) return res.status(status).json({error:'Supabase error',detail:data});
    return res.json(Array.isArray(data)?data[0]:(data||{ok:true}));
  });
});
router.get('/list',function(req,res){
  var cid=req.query.creator_id||'';
  if(!cid) return res.status(400).json({error:'creator_id required'});
  var limit=Math.min(parseInt(req.query.limit,10)||20,100);
  sb('GET','/rest/v1/vods?creator_id=eq.'+encodeURIComponent(cid)+'&order=created_at.desc&limit='+limit,null,function(err,status,data){
    if(err) return res.status(500).json({error:'DB error'});
    return res.json(Array.isArray(data)?data:[]);
  });
});
router.delete('/:id',function(req,res){
  sb('DELETE','/rest/v1/vods?id=eq.'+encodeURIComponent(req.params.id),null,function(err){
    if(err) return res.status(500).json({error:'DB error'});
    return res.json({ok:true});
  });
});
module.exports=router;
