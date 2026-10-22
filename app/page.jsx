import Link from 'next/link';
export default function Home() {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"28px",background:"#f5f5ef"}}>
    <div style={{maxWidth:760,width:"100%",border:"1px solid #d2d8d2",background:"#fff",borderRadius:28,padding:"clamp(28px,6vw,68px)",boxShadow:"0 24px 80px #25302a12"}}>
      <span style={{letterSpacing:2,fontSize:12,fontWeight:700,color:"#36765c"}}>U-M STUDENT RESEARCH · 3-MINUTE SURVEY</span>
      <h1 style={{fontSize:"clamp(44px,8vw,76px)",lineHeight:1.03,letterSpacing:"-0.07em",margin:"24px 0"}}>Out, in &amp; everything between.</h1>
      <p style={{fontSize:20,lineHeight:1.6,maxWidth:560}}>We're exploring what makes people go outside or stay in, how they feel, and whether gentle reminders might help. One short, mobile-friendly survey. No texting setup.</p>
      <p style={{fontSize:15,lineHeight:1.7,color:"#5b675f"}}>Made by Dhwani, Muffi &amp; Ashley · University of Michigan</p>
      <Link href="/survey" style={{display:"inline-block",background:"#202e26",color:"#fff",padding:"17px 26px",borderRadius:12,textDecoration:"none",fontSize:17,fontWeight:700,marginTop:20}}>Take the survey ↗</Link>
      <p style={{fontSize:13,color:"#64736a",marginTop:30}}>Questions? <a href="mailto:dhwanib@umich.edu" style={{color:"#315d4d"}}>dhwanib@umich.edu</a></p>
    </div>
  </main>;
}
