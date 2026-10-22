import { WalletConnect } from './WalletConnect'
import NetworkBadge from './NetworkBadge'

function Header() {
  return (
    <header className="
      mt-[20px] md:mt-[50px] 
      mx-auto 
      px-4 md:px-6 
      py-4 
      bg-[#1F1E1F] 
      border-[#1F1E1F] 
      flex flex-col md:flex-row 
      items-center justify-between 
      w-[95%] max-w-6xl
      rounded-[24px] md:rounded-[32px]
      gap-4 md:gap-0
    ">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#bcf36a]/25 bg-[#bcf36a]/10 font-mono text-sm font-semibold text-[#bcf36a]"
          >
            S
          </span>
          <span className="text-[#FFFFFF] text-[20px] md:text-[24.77px] font-medium font-instrument">
            Scaffold Stacks
          </span>
        </div>  
        <NetworkBadge />
      </div>

      <div className='flex items-center space-x-4 md:space-x-6'>
      <a 
            href="https://github.com/scaffold-stack/scaffold-stack" 
            target="_blank" 
            rel="noopener noreferrer"
            className="no-underline" 
          >
        <div className='hidden sm:flex space-x-2 items-center justify-center cursor-pointer hover:opacity-80 transition-opacity'>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current text-[#8F8D8E]">
            <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.2 3.23.91.1-.72.39-1.2.7-1.47-2.47-.28-5.07-1.24-5.07-5.49 0-1.21.43-2.2 1.15-2.98-.12-.29-.5-1.41.11-2.94 0 0 .94-.3 3.06 1.14a10.65 10.65 0 0 1 5.57 0c2.12-1.44 3.06-1.14 3.06-1.14.61 1.53.23 2.65.11 2.94.72.78 1.15 1.77 1.15 2.98 0 4.26-2.6 5.2-5.08 5.48.4.35.76 1.02.76 2.06v3.11c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
          </svg>
          <span className='text-[14px] md:text-[16px] text-[#8F8D8E] font-instrument'>GitHub</span>
        </div>
        </a>
        <WalletConnect />
      </div>
    </header>
  )
}

export default Header