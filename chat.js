import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL="https://fauoohclvblciogeluiy.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW9vaGNsdmJsY2lvZ2VsdWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTAzNzgsImV4cCI6MjA4NzE4NjM3OH0.uZlfIOpsf6ezDPfh9LhONsY2DsDQ9RQf2IRec1WXYWE";

const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

const logEl=document.getElementById("chat-log");
const formEl=document.getElementById("chat-form");
const inputEl=document.getElementById("chat-input");
const nameBtn=document.getElementById("name-btn");
const typingEl=document.getElementById("typing");
const onlinePill=document.getElementById("online-pill");

const STORAGE_NAME="pp_chat_name";

function escapeHtml(str){
return String(str).replace(/[&<>"]/g,c=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;"
}[c]));
}

function colorFromName(name){
let hash=0;
for(let i=0;i<name.length;i++){
hash=name.charCodeAt(i)+((hash<<5)-hash);
}
const hue=hash%360;
return `hsl(${hue},70%,60%)`;
}

function formatTime(t){
return new Date(t).toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
});
}

function renderMessageText(text){

if(text.match(/\.(png|jpg|jpeg|gif|webp)$/i)){
return `<img src="${text}" style="max-width:250px;border-radius:8px;">`;
}

if(text.includes("youtube.com")||text.includes("youtu.be")){
let id=text.split("v=")[1];
if(id) id=id.split("&")[0];
return `<iframe width="260" height="150" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
}

return escapeHtml(text);
}

function addMessage(msg,local=false){

const row=document.createElement("div");
row.className="msg"+(local?" local":"");

row.innerHTML=`
<div class="bubble">
<div class="meta">
<span class="name" style="color:${colorFromName(msg.name)}">${escapeHtml(msg.name)}</span>
<span>${formatTime(msg.created_at)}</span>
</div>
<div class="text">${renderMessageText(msg.text)}</div>
</div>
`;

logEl.appendChild(row);
logEl.scrollTop=logEl.scrollHeight;
}

function getName(){
return localStorage.getItem(STORAGE_NAME)||"";
}

function setName(n){
localStorage.setItem(STORAGE_NAME,n);
nameBtn.textContent="Name: "+n;
}

nameBtn.onclick=()=>{
const n=prompt("Pick username",getName()||"anon");
if(n) setName(n);
};

function ensureName(){
let n=getName();
if(!n){
n=prompt("Pick username","anon")||"anon";
setName(n);
}
return n;
}

formEl.addEventListener("submit",async e=>{
e.preventDefault();

const name=ensureName();
const text=inputEl.value.trim();

if(!text) return;

if(text.startsWith("/")){

if(text.startsWith("/nick")){
const n=text.split(" ")[1];
if(n) setName(n);
return;
}

if(text==="/clear"){
logEl.innerHTML="";
return;
}

if(text==="/shrug"){
inputEl.value="¯\\_(ツ)_/¯";
return;
}

}

inputEl.value="";

addMessage({name,text,created_at:new Date().toISOString()},true);

await supabase.from("messages").insert({name,text});
});

async function init(){

ensureName();

const {data}=await supabase
.from("messages")
.select("*")
.order("created_at",{ascending:true})
.limit(100);

data.forEach(addMessage);

supabase
.channel("chat")
.on("postgres_changes",
{event:"INSERT",schema:"public",table:"messages"},
payload=>{
addMessage(payload.new);
})
.subscribe();

}

init();
