const TermsPage = () => {
  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-4 text-sm text-muted">
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

        <p>
          This service runs on free hosting with no persistent storage.
          Cached pages and past results are cleared whenever the service
          restarts, which happens automatically after periods of
          inactivity. The first request after an idle period may also take
          up to a minute to respond while the service starts back up.
        </p>
      </div>
    </main>
  );
};

export default TermsPage;