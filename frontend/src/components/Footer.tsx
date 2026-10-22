function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-7 text-center text-[11px] text-[#777d72] sm:flex-row sm:px-8 sm:text-left">
      <span>Built in the open for the Stacks ecosystem.</span>
      <a
        href="https://github.com/scaffold-stack/scaffold-stack"
        target="_blank"
        rel="noopener noreferrer"
        className="transition hover:text-[#bcf36a]"
      >
        Scaffold Stacks on GitHub
      </a>
    </footer>
  );
}

export default Footer;