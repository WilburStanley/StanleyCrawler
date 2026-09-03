const TermsPage = () => {
  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto space-y-4 text-sm text-muted">
        <h1 className="text-xl font-medium text-text">Terms</h1>

        <p>
          StanleyCrawler is a personal portfolio and internship project. It&apos;s
          provided as-is, with no uptime or accuracy guarantees.
        </p>

        <p>
          The auto-scrape feature is meant for pages you have the right to
          access and scrape. Don&apos;t use it against sites whose terms of
          service prohibit scraping, or to bypass logins, paywalls, or access
          controls.
        </p>

        <p>
          Scraped data reflects whatever the source page published at the
          time of the request, and its accuracy depends entirely on that
          source.
        </p>
      </div>
    </main>
  );
};

export default TermsPage;