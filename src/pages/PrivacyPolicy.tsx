import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to app
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> 28 March 2026</p>

        <h2>Summary</h2>
        <p>
          My Week Visualisation is a fully client-side web application. <strong>Your data never leaves your device.</strong> We do not collect, store, transmit, or share any personal information or schedule data.
        </p>

        <h2>Data collection</h2>
        <p>
          We do not collect any personal data. All schedule information you enter — including sleep times, categories, and time slots — is processed entirely within your web browser. No data is sent to any server or third party.
        </p>

        <h2>Cookies and local storage</h2>
        <p>
          This app may use your browser's local storage to preserve your schedule between visits for your convenience. This data is stored only on your device and is never transmitted externally. You can clear it at any time through your browser settings.
        </p>

        <h2>Analytics and tracking</h2>
        <p>
          We do not use any analytics, tracking pixels, or third-party scripts that monitor your behaviour. There are no cookies set for advertising or tracking purposes.
        </p>

        <h2>Image export and sharing</h2>
        <p>
          When you save or share your week visualisation, the image is generated entirely in your browser. If you choose to share via your device's native share functionality, the image is handled by your operating system — we have no access to it.
        </p>

        <h2>Third-party services</h2>
        <p>
          This application does not integrate with any third-party services that process your data. It runs entirely in your browser with no external API calls.
        </p>

        <h2>Children's privacy</h2>
        <p>
          Since we do not collect any data, there are no special concerns regarding children's privacy.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If we make changes to this privacy policy, we will update the "Last updated" date above.
        </p>

        <h2>Contact</h2>
        <p>
          If you have any questions about this privacy policy, please reach out via the feedback widget within the app.
        </p>
      </main>
    </div>
  );
}
