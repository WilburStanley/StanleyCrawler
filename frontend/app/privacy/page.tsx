const PrivacyPage = () => {
  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-4 text-sm text-muted">
        <h1 className="text-xl font-medium text-text">Privacy</h1>

        <p>
          StanleyCrawler doesn&apos;t use accounts, cookies, or analytics.
          Nothing you enter here is stored beyond the current session, the
          URL you submit is sent to this project&apos;s own backend, used to
          run a scrape, and then discarded.
        </p>

        <p>
          The auto scrape feature fetches whatever public page you point it
          at. That page&apos;s own server will see a request from this
          project&apos;s scraper, the same way it would see a request from
          any browser, see the scraper&apos;s user agent for how it
          identifies itself.
        </p>

        <p>
          This is a portfolio and internship project, not a commercial
          service, and isn&apos;t intended to process personal data at
          scale.
        </p>
      </div>
    </main>
  );
};

export default PrivacyPage;