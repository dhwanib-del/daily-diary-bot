import './survey.css';

export const metadata = {
  title:'Out, In & Everything Between | U-M Research Survey',
  description:'A short research survey on staying in, going out, mood, motivation and reminders.'
};

function Choice({name,value,children}) {
  return <label className="answer-option">
    <input type="radio" name={name} value={value} required={true}/>
    <span className="answer-mark" aria-hidden="true"/>
    <span>{children}</span>
  </label>;
}
function Question({number,title,helper,children}) {
  return <fieldset className="survey-question">
    <legend><span className="question-number">{number}</span>{title}</legend>
    {helper?<p className="question-helper">{helper}</p>:null}
    <div className="answer-grid">{children}</div>
  </fieldset>;
}
export default function Survey() {
 return <div className="survey-page">
    <div className="paper-sticker sticker-one" aria-hidden="true">↗</div>
    <div className="paper-sticker sticker-two" aria-hidden="true">✳</div>
    <header className="survey-header">
      <a href="/" className="survey-wordmark">IN / OUT <span>research notes</span></a>
      <span className="header-tag">U-M · STUDENT RESEARCH</span>
    </header>
    <main className="survey-main">
      <section className="survey-intro">
        <div className="intro-eyebrow"><span className="eyebrow-dot"/> ONE-TIME SURVEY <span className="eyebrow-divider">/</span> ABOUT 3 MINUTES</div>
        <h1>Out, in &amp; <em>everything</em> between.</h1>
        <p className="intro-lead">What makes us head outside, stay in, or change our plans? And how does that connect to how we feel?</p>
        <p className="intro-description">We're Dhwani, Muffi &amp; Ashley, student researchers at the University of Michigan. We're exploring daily decisions, mood, and whether gentle reminders might help. There are no right answers — we're interested in your actual experience.</p>
        <div className="intro-facts">
          <span>✳ Just one check-in</span>
          <span>✳ No account or phone number</span>
          <span>✳ Optional written thoughts</span>
        </div>
      </section>
      <form action="/api/survey" method="post" className="survey-form">
        <div className="trap" aria-hidden="true"><label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off"/></label></div>
        <section className="survey-section" aria-labelledby="section-one">
          <div className="section-heading"><span className="section-index">01 / 03</span><h2 id="section-one">Your day, your choices.</h2><p>Think about today so far, or your most recent typical day.</p></div>
          <Question number="01" title="Which best describes your day?">
            <Choice name="activity" value="went">I went outside</Choice>
            <Choice name="activity" value="tried">I tried to go out, but didn't</Choice>
            <Choice name="activity" value="wanted">I wanted to go out, but stayed in</Choice>
            <Choice name="activity" value="chose">I chose to stay in</Choice>
          </Question>
          <Question number="02" title="What was the biggest factor in that choice?" helper="Choose the one that mattered most.">
            <Choice name="main_factor" value="work_class">Class or work</Choice>
            <Choice name="main_factor" value="social">Seeing other people</Choice>
            <Choice name="main_factor" value="errands">Errands or tasks</Choice>
            <Choice name="main_factor" value="fresh_air">Fresh air or exercise</Choice>
            <Choice name="main_factor" value="energy">My mood or energy</Choice>
            <Choice name="main_factor" value="getting_ready">Getting ready felt like effort</Choice>
            <Choice name="main_factor" value="weather_transport">Weather or transportation</Choice>
            <Choice name="main_factor" value="lost_time">I lost track of time</Choice>
            <Choice name="main_factor" value="prefer_home">I preferred being at home</Choice>
            <Choice name="main_factor" value="other">Something else</Choice>
          </Question>
        </section>
        <section className="survey-section" aria-labelledby="section-two">
          <div className="section-heading"><span className="section-index">02 / 03</span><h2 id="section-two">And how did it feel?</h2><p>There isn't a preferred answer. Staying home can be exactly what you needed.</p></div>
          <Question number="03" title="How would you rate your mood today?">
            <Choice name="mood" value="1">1 — Very low</Choice>
            <Choice name="mood" value="2">2 — Low</Choice>
            <Choice name="mood" value="3">3 — Okay</Choice>
            <Choice name="mood" value="4">4 — Good</Choice>
            <Choice name="mood" value="5">5 — Very good</Choice>
          </Question>
          <Question number="04" title="Thinking about going out or staying in, what did you notice about your mood?">
            <Choice name="perceived_mood_effect" value="better">My mood felt better</Choice>
            <Choice name="perceived_mood_effect" value="same">No noticeable difference</Choice>
            <Choice name="perceived_mood_effect" value="worse">My mood felt worse</Choice>
            <Choice name="perceived_mood_effect" value="unsure">It's hard to say</Choice>
          </Question>
          <Question number="05" title="Did this affect what you planned to get done?">
            <Choice name="plan_impact" value="yes">Yes, a lot</Choice>
            <Choice name="plan_impact" value="somewhat">A little</Choice>
            <Choice name="plan_impact" value="no">Not really</Choice>
            <Choice name="plan_impact" value="no_plans">I didn't have plans</Choice>
          </Question>
          <label className="note-field"><span className="note-heading">A little more context <span className="optional-chip">OPTIONAL</span></span><span className="note-caption">What was going through your mind when you decided to go out or stay in?</span><textarea name="feelings_note" maxLength={600} rows={3} placeholder="I felt... / I was thinking..."/></label>
        </section>
        <section className="survey-section" aria-labelledby="section-three">
          <div className="section-heading"><span className="section-index">03 / 03</span><h2 id="section-three">A little nudge, maybe?</h2><p>We're exploring whether reminders might be useful — including when they're not.</p></div>
          <Question number="06" title="Would a gentle reminder or nudge have been welcome today?">
            <Choice name="reminder_help" value="yes">Yes</Choice>
            <Choice name="reminder_help" value="maybe">Maybe, depending on the timing</Choice>
            <Choice name="reminder_help" value="no">No, I'd rather not get one</Choice>
            <Choice name="reminder_help" value="not_sure">I'm not sure</Choice>
          </Question>
          <Question number="07" title="If you ever wanted a reminder, when would it feel right?" helper="You can skip this question.">
            <Choice name="reminder_timing" value="before_plans">Before my planned activity</Choice>
            <Choice name="reminder_timing" value="after_time_inside">After I've been inside a while</Choice>
            <Choice name="reminder_timing" value="on_request">Only when I ask for one</Choice>
            <Choice name="reminder_timing" value="never">Never</Choice>
            <Choice name="reminder_timing" value="not_sure">Not sure</Choice>
          </Question>
          <label className="note-field"><span className="note-heading">One last thought <span className="optional-chip">OPTIONAL</span></span><span className="note-caption">What would make it easier to follow through on the plans you actually want? Or tell us why reminders wouldn't help.</span><textarea name="support_note" maxLength={600} rows={3} placeholder="Honestly, what would help is..."/></label>
        </section>
        <section className="survey-submit">
          <label className="consent-label"><input type="checkbox" name="consent" value="yes" required/><span>I agree to share my responses for this University of Michigan student research project. Participation is voluntary. No name or phone number is requested; please avoid identifying details in written answers.</span></label>
          <div className="submit-area">
            <button type="submit" className="submit-button">Send my responses <span aria-hidden="true">↗</span></button>
            <span className="submit-aside">Thanks for being part of this.</span>
          </div>
        </section>
      </form>
    </main>
    <footer className="survey-footer"><span>Made with curiosity.</span><span>With love, Dhwani, Muffi &amp; Ashley</span><a href="mailto:dhwanib@umich.edu">Questions? Contact us</a></footer>
  </div>;
}
