export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">© UW Blockchain Society. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://twitter.com/udubblockchain" className="text-xs text-muted hover:text-white">Twitter</a>
            <a href="https://www.instagram.com/uwblockchain/" className="text-xs text-muted hover:text-white">Instagram</a>
            <a href="mailto:blockchn@uw.edu" className="text-xs text-muted hover:text-white">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}