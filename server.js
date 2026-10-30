require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { supabase, isDatabaseConfigured } = require("./supabase");

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(",").map(s => s.trim()) : true
}));
app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

const seedJobs = [
  { id:"demo-job-1", title:"Frontend Developer Intern", company:"PixelCraft", location:"Hyderabad", type:"Internship", salary:"₹15k–20k/mo", skills:["HTML","CSS","JavaScript"], description:"Help create delightful and accessible web experiences with a product-focused team.", logo:"P", featured:true },
  { id:"demo-job-2", title:"Graduate Software Engineer", company:"Nexora Technologies", location:"Bengaluru", type:"Full-time", salary:"₹6–8 LPA", skills:["JavaScript","SQL","Problem solving"], description:"Build and maintain reliable software products while learning from experienced engineers.", logo:"N", featured:true },
  { id:"demo-job-3", title:"Data Analyst Intern", company:"InsightLoop", location:"Remote", type:"Internship", salary:"₹12k–18k/mo", skills:["SQL","Excel","Python"], description:"Turn business data into clear insights and help teams make better decisions.", logo:"I", featured:true },
  { id:"demo-job-4", title:"UI/UX Design Intern", company:"Northstar Studio", location:"Hyderabad", type:"Internship", salary:"₹10k–15k/mo", skills:["Figma","Wireframes","Research"], description:"Support user research and design intuitive interfaces for real customer problems.", logo:"N" },
  { id:"demo-job-5", title:"Backend Developer", company:"CloudHarbor", location:"Pune", type:"Full-time", salary:"₹5–7 LPA", skills:["Node.js","REST APIs","PostgreSQL"], description:"Develop secure APIs and database-backed features for a growing SaaS platform.", logo:"C" },
  { id:"demo-job-6", title:"Campus Marketing Associate", company:"BrightPath", location:"Remote", type:"Part-time", salary:"₹8k–12k/mo", skills:["Communication","Content","Planning"], description:"Help student communities discover career resources and early-career opportunities.", logo:"B" }
];
const demoProfile = { id:"demo-student", fullName:"Student User", email:"student@example.com", course:"B.Tech Computer Science", graduationYear:"2028", skills:["JavaScript","HTML","CSS"], linkedin:"", summary:"Curious computer science student interested in building useful products." };
let demoApplications = [
  { id:"demo-app-1", jobId:"demo-job-2", jobTitle:"Graduate Software Engineer", company:"Nexora Technologies", status:"Under Review", appliedAt:new Date(Date.now()-86400000*3).toISOString(), coverNote:"I am excited to apply." },
  { id:"demo-app-2", jobId:"demo-job-3", jobTitle:"Data Analyst Intern", company:"InsightLoop", status:"Interview", appliedAt:new Date(Date.now()-86400000*6).toISOString(), coverNote:"I enjoy working with data." }
];
let demoProfileState = { ...demoProfile };

function cleanText(value, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function asyncRoute(fn) { return (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next); }
function requireDb(req,res,next) {
  if (!isDatabaseConfigured) return res.status(503).json({ error:"Supabase is not configured. This action is available in demo mode; configure backend/.env to persist data." });
  next();
}
function profileForClient(row) {
  return { id:row.id, fullName:row.full_name, email:row.email, course:row.course || "", graduationYear:row.graduation_year ? String(row.graduation_year) : "", skills:row.skills || [], linkedin:row.linkedin || "", summary:row.summary || "" };
}
function jobForClient(row) {
  return { id:row.id, title:row.title, company:row.company, location:row.location, type:row.job_type, salary:row.salary || "Compensation varies", skills:row.skills || [], description:row.description || "", logo:(row.company || "J").slice(0,1).toUpperCase() };
}
function applicationForClient(row, job) {
  return { id:row.id, jobId:row.job_id, jobTitle:job?.title || row.job_title || "Position", company:job?.company || row.company || "Company", status:row.status, appliedAt:row.applied_at || row.created_at, coverNote:row.cover_note || "" };
}
app.get("/api/health", (req,res) => res.json({ ok:true, mode:isDatabaseConfigured?"supabase":"demo", service:"Student Placement & Career Portal API" }));

app.get("/api/bootstrap", asyncRoute(async (req,res) => {
  if (!isDatabaseConfigured) return res.json({ demo:true, user:demoProfileState, profile:demoProfileState, jobs:seedJobs, applications:demoApplications });
  const [jobsResult, profileResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("is_active",true).order("created_at",{ascending:false}),
    supabase.from("profiles").select("*").limit(1).maybeSingle()
  ]);
  if (jobsResult.error) throw jobsResult.error;
  if (profileResult.error) throw profileResult.error;
  const jobs=(jobsResult.data||[]).map(jobForClient);
  const profile=profileResult.data?profileForClient(profileResult.data):{...demoProfile,fullName:"New Student",email:"student@example.com",skills:[]};
  const appResult = profileResult.data ? await supabase.from("applications").select("*, jobs(title,company)").eq("student_id",profileResult.data.id).order("applied_at",{ascending:false}) : {data:[],error:null};
  if (appResult.error) throw appResult.error;
  const applications=(appResult.data||[]).map(a=>applicationForClient(a,a.jobs));
  res.json({demo:false,user:profile,profile,jobs,applications});
}));

app.put("/api/profile", asyncRoute(async (req,res) => {
  const body=req.body||{};
  const fullName=cleanText(body.fullName,80), email=cleanText(body.email,160).toLowerCase();
  if (!fullName) return res.status(400).json({error:"Full name is required."});
  const skills=Array.isArray(body.skills)?body.skills.map(s=>cleanText(s,40)).filter(Boolean).slice(0,15):cleanText(body.skills,300).split(",").map(s=>s.trim()).filter(Boolean).slice(0,15);
  const profile={fullName,email,course:cleanText(body.course,100),graduationYear:cleanText(String(body.graduationYear||""),4),skills,linkedin:cleanText(body.linkedin,250),summary:cleanText(body.summary,600)};
  if (profile.linkedin && !/^https:\/\/(www\.)?linkedin\.com\//i.test(profile.linkedin)) return res.status(400).json({error:"Please enter a valid HTTPS LinkedIn profile URL."});
  if (!isDatabaseConfigured) {
    demoProfileState={...demoProfileState,...profile};
    return res.json({profile:demoProfileState,demo:true});
  }
  if (!validEmail(email)) return res.status(400).json({error:"A valid email address is required for the profile."});
  const row={full_name:fullName,email,course:profile.course||null,graduation_year:/^(20\d{2})$/.test(profile.graduationYear)?Number(profile.graduationYear):null,skills,linkedin:profile.linkedin||null,summary:profile.summary||null};
  // This classroom MVP keeps one shared demonstration profile; a production release should key profiles to verified Supabase Auth users.
  const {data,error}=await supabase.from("profiles").upsert(row,{onConflict:"email"}).select("*").single();
  if(error)throw error;
  res.json({profile:profileForClient(data),demo:false});
}));

app.post("/api/applications", asyncRoute(async (req,res) => {
  const jobId=cleanText(String(req.body?.jobId||""),100);
  const coverNote=cleanText(req.body?.coverNote,700);
  if(!jobId)return res.status(400).json({error:"Choose an opportunity before applying."});
  if(!isDatabaseConfigured){
    const job=seedJobs.find(j=>j.id===jobId);
    if(!job)return res.status(404).json({error:"Opportunity not found. Refresh the page and try again."});
    if(demoApplications.some(a=>a.jobId===jobId))return res.status(409).json({error:"You have already applied for this role."});
    const application={id:`demo-app-${Date.now()}`,jobId,jobTitle:job.title,company:job.company,status:"Applied",appliedAt:new Date().toISOString(),coverNote};
    demoApplications.unshift(application);
    return res.status(201).json({application,demo:true});
  }
  const {data:job,error:jobError}=await supabase.from("jobs").select("id,title,company").eq("id",jobId).eq("is_active",true).maybeSingle();
  if(jobError)throw jobError;
  if(!job)return res.status(404).json({error:"Opportunity not found or no longer open."});
  const {data:profile,error:profileError}=await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if(profileError)throw profileError;
  if(!profile)return res.status(400).json({error:"Create and save your career profile before applying."});
  const {data,error}=await supabase.from("applications").insert({student_id:profile.id,job_id:job.id,cover_note:coverNote}).select("*, jobs(title,company)").single();
  if(error&&error.code==="23505")return res.status(409).json({error:"You have already applied for this role."});
  if(error)throw error;
  res.status(201).json({application:applicationForClient(data,data.jobs),demo:false});
}));

app.patch("/api/applications/:id", asyncRoute(async (req,res) => {
  const allowed=["Applied","Under Review","Interview","Rejected","Offer"];
  const status=cleanText(req.body?.status,30);
  if(!allowed.includes(status))return res.status(400).json({error:"Choose a valid application status."});
  if(!isDatabaseConfigured){
    const appRecord=demoApplications.find(a=>a.id===req.params.id);
    if(!appRecord)return res.status(404).json({error:"Application not found."});
    appRecord.status=status;
    return res.json({application:appRecord,demo:true});
  }
  const {data,error}=await supabase.from("applications").update({status}).eq("id",req.params.id).select("*, jobs(title,company)").single();
  if(error?.code==="PGRST116")return res.status(404).json({error:"Application not found."});
  if(error)throw error;
  res.json({application:applicationForClient(data,data.jobs),demo:false});
}));

app.use("/api", (req,res) => res.status(404).json({error:"API route not found."}));
app.use((err,req,res,next) => {
  console.error("[API error]", err?.message || err);
  if(res.headersSent)return next(err);
  res.status(500).json({error:"Something went wrong while processing the request. Check the server terminal for details."});
});

app.listen(PORT, () => {
  console.log(`\nCareerSpring API ready: http://localhost:${PORT}`);
  console.log(`Mode: ${isDatabaseConfigured?"Supabase PostgreSQL":"DEMO (in-memory sample data)"}`);
  console.log("Open http://localhost:" + PORT + " in your browser.\n");
});
