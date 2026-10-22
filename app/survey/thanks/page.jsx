import '../survey.css';
export const metadata={title:'Thank you | In / Out Research'};
export default function ThankYou() {
 return <main className="thanks-wrap">
  <div className="thanks-stamp" aria-hidden="true">✳</div>
  <span className="intro-eyebrow">THAT'S A WRAP</span>
  <h1>Thank you for <em>sharing.</em></h1>
  <p>Your response has been saved. We're learning about what really shapes our days — and your perspective helps.</p>
  <p>With love,<br/><strong>Dhwani, Muffi &amp; Ashley</strong></p>
  <a className="back-link" href="/">Back to the beginning ↗</a>
 </main>;
}
