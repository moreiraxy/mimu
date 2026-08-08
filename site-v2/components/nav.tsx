/* Gerado por tools/convert.mjs a partir de ../pierre-clone/index.html.
   Barra de navegacao (desktop + mobile).
   Markup preservado 1:1 — nao editar a mao; ajuste o conversor. */

export default function Nav() {
  return (
    <>
      <div data-wf--nav--nav-position="default" className="nav_component">
        {' '}
        <div className="u-embed-css w-embed">
          {' '}
          <style
            dangerouslySetInnerHTML={{
              __html: "\n            :root {\n              --nav--menu-open-duration: 400ms;\n              --nav--menu-close-duration: 400ms;\n              --nav--dropdown-open-duration: 400ms;\n              --nav--dropdown-close-duration: 400ms;\n            }\n            body:has(.nav_component .w-nav-button.w--open):not(\n                :has(.nav_desktop_wrap:not(.w-condition-invisible))\n              ) {\n              overflow: hidden;\n            }\n            /* on smaller screens */\n            @media (width < 65em) {\n              /* disable scroll when mobile menu is open */\n              body:has(.nav_component .w-nav-button.w--open) {\n                overflow: hidden;\n              }\n            }\n            /* on larger screens */\n            @container (min-width: 65em) {\n              /* show desktop nav & dropdown backdrop */\n              .nav_desktop_wrap,\n              .nav_dropdown_backdrop {\n                display: block;\n              }\n              /* hide mobile nav & mobile menu backdrop */\n              .nav_desktop_wrap:not(.w-condition-invisible) ~ .nav_mobile_wrap,\n              .nav_desktop_wrap:not(.w-condition-invisible) ~ .nav_menu_backdrop {\n                display: none;\n              }\n            }\n            /* dropdown list: initial state */\n            html:not(.wf-design-mode) .nav_dropdown_component > .w-dropdown-list {\n              /* removes display none to enable css transitions */\n              display: grid !important;\n              grid-template-columns: minmax(0, 1fr);\n              /* sets list to 0 height by default */\n              grid-template-rows: 0fr;\n              transition: grid-template-rows var(--nav--dropdown-close-duration);\n              /* makes list content not focusable when closed */\n              visibility: hidden;\n              opacity: 0;\n            }\n            /* makes list content focusable when opened */\n            html:not(.wf-design-mode) .nav_dropdown_component > .w-dropdown-list.w--open {\n              visibility: visible;\n              opacity: 1;\n            }\n            /* sets list child to overflow hidden to enable css height transition */\n            .nav_dropdown_component > .w-dropdown-list > * {\n              overflow: hidden;\n            }\n            /* set open state of dropdown list */\n            .nav_dropdown_component:has(> .w-dropdown-toggle[aria-expanded=\"true\"])\n              > .w-dropdown-list {\n              --nav--dropdown-close-duration: var(--nav--dropdown-open-duration);\n              grid-template-rows: 1fr;\n            }\n            /* on desktop, delay dropdown opening if another dropdown is open */\n            .nav_desktop_wrap:has(\n                .nav_dropdown_component > .w-dropdown-toggle.w--open[aria-expanded=\"false\"]\n              )\n              .nav_dropdown_component:has(> .w--open[aria-expanded=\"true\"])\n              > .w-dropdown-list {\n              transition-delay: var(--nav--dropdown-close-duration);\n            }\n            /* reveal dropdown backdrop when dropdown open */\n            .nav_dropdown_backdrop {\n              transition: opacity var(--nav--dropdown-close-duration);\n            }\n            body:has(.nav_dropdown_component > [aria-expanded=\"true\"]) .nav_dropdown_backdrop {\n              opacity: 1;\n            }\n            /* reveal mobile menu backdrop on menu open */\n            .nav_menu_backdrop {\n              transition: opacity var(--nav--menu-close-duration);\n            }\n            .nav_component:has(.w-nav-button.w--open) .nav_menu_backdrop {\n              opacity: 1;\n            }\n            /* menu animations */\n            @keyframes menuOpen {\n              from {\n                clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);\n              }\n              to {\n                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);\n              }\n            }\n            @keyframes menuClose {\n              from {\n                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);\n              }\n              to {\n                clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);\n              }\n            }\n            /* menu open */\n            .nav_component:has(.w-nav-button.w--open) .w-nav-menu {\n              animation: menuOpen var(--nav--menu-open-duration) ease-in-out forwards;\n            }\n            /* menu close */\n            .nav_component:has(.w-nav-button:not(.w--open)) .w-nav-menu {\n              animation: menuClose var(--nav--menu-close-duration) ease-in-out forwards;\n            }\n            /* position overflow to top of screen */\n            .nav_component .w-nav-overlay {\n              top: 0;\n              min-height: 100vh;\n            }\n            /* open dropdown on mobile */\n            .nav_mobile_wrap [data-open-on-mobile] > .w-dropdown-toggle {\n              display: none;\n            }\n            .nav_mobile_wrap [data-open-on-mobile] > .w-dropdown-list {\n              visibility: visible !important;\n              opacity: 1 !important;\n              display: block !important;\n              grid-template-rows: 1fr !important;\n            }\n            /* nav banner */\n            html:has(.nav_banner_wrap:not(.w-condition-invisible)):not(.hide-nav-banner) {\n              --nav--height-total: calc(\n                var(--nav--banner-height) + var(--nav--height) + var(--nav--spacing-outer-vertical)\n              );\n            }\n            .hide-nav-banner .nav_banner_wrap {\n              display: none;\n            }\n            .wf-design-mode .nav_mobile_menu_wrap {\n              width: 100%;\n            }\n          ",
            }}
          />
          {' '}
        </div>
        {' '}
        <a href="#main" className="nav_skip_wrap w-inline-block">
          <div className="nav_skip_text u-text-style-small">
            {"Skip to main content"}
          </div>
        </a>
        {' '}
        <header className="nav_desktop_wrap">
          {' '}
          <div className="nav_desktop_contain">
            {' '}
            <div className="nav_desktop_layout">
              {' '}
              <a aria-label="Home Page" href="/" aria-current="page" className="nav_desktop_logo w-inline-block w--current">
                <div className="u-max-width-full">
                  {' '}
                  <div className="nav_logo w-embed">
                    {' '}
                    <svg width="100%" height="Auto" viewBox="0 0 116 33" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mimu">
                      <rect width="33" height="33" rx="7.5" fill="#FF6B5B" />
                      <svg x="6" y="8.6" width="21" height="15.75" viewBox="0 0 48 36" fill="none">
                        <path d="M2 34 L2 8 Q2 2 8 2 Q14 2 16 8 L24 24 L32 8 Q34 2 40 2 Q46 2 46 8 L46 34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <text x="41" y="24.5" fill="#FF6B5B" fontFamily="'Space Grotesk', Nunito, sans-serif" fontSize="26" fontWeight="600" letterSpacing="-1.2">mimu</text>
                    </svg>
                    {' '}
                  </div>
                </div>
              </a>
              {' '}
              <nav effect="links-component" aria-label="Main" data-wf--menu--variant="desktop---right" className="nav_links_component w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a">
                {' '}
                <ul role="list" className="nav_links_wrap w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-list-unstyled">
                  {' '}
                  <li className="nav_links_item">
                    {' '}
                    <a href="#features" className="nav_links_link w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-inline-block">
                      <div className="nav_links_text">
                        {"Recursos"}
                      </div>
                    </a>
                    {' '}
                  </li>
                  {' '}
                  <li className="nav_links_item">
                    {' '}
                    <a href="#pricing" className="nav_links_link w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-inline-block">
                      <div className="nav_links_text">
                        {"Preços"}
                      </div>
                    </a>
                    {' '}
                  </li>
                  {' '}
                  <li className="nav_links_item">
                    {' '}
                    <a href="#seguranca" className="nav_links_link w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-inline-block">
                      <div className="nav_links_text">
                        {"Segurança"}
                      </div>
                    </a>
                    {' '}
                  </li>
                  {' '}
                  <li className="nav_links_item">
                    {' '}
                    <a href="https://one.pierre.finance/" className="nav_links_link w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-inline-block">
                      <div className="nav_links_text">
                        {"Pierre One"}
                      </div>
                    </a>
                    {' '}
                  </li>
                  {' '}
                </ul>
                {' '}
                <div data-wf--spacer--variant="tiny" className="u-section-spacer w-variant-6332f150-e0d7-e14b-7d01-13016a0e1cdf u-ignore-trim" />
                {' '}
                <ul role="list" className="nav_actions_wrap w-variant-199e0ac7-340d-b304-8ff9-c91aaa7ae58a w-list-unstyled">
                  {' '}
                  <li className="nav_buttons_item">
                    {' '}
                    <div data-wf--button-main--variant="primary" data-button=" " data-trigger="hover focus" className="button_main_wrap">
                      {' '}
                      <div className="clickable_wrap u-cover-absolute">
                        {' '}
                        <a className="clickable_link w-inline-block" data-subscription-type="" data-cta-name="login_header" href="https://pierre.finance/login" data-link-category="" data-cta-location="lp_header" data-track-event="cta_clicked" data-cta-type="login" data-plan-type="" data-onelink="" data-link-destination="" data-link-page="">
                          <span className="clickable_text u-sr-only">
                            {"Entrar"}
                          </span>
                        </a>
                        {' '}
                      </div>
                      {' '}
                      <div className="button_main_element">
                        {' '}
                        <div aria-hidden="true" className="button_main_text u-weight-medium u-text-style-small u-no-wrap-line">
                          {" Entrar "}
                        </div>
                        {' '}
                        <div className="button_main_icon u-hide-if-empty" />
                        {' '}
                        <div className="button_main_line" />
                        {' '}
                      </div>
                      {' '}
                    </div>
                    {' '}
                  </li>
                  {' '}
                </ul>
                {' '}
              </nav>
              {' '}
            </div>
            {' '}
          </div>
          {' '}
        </header>
        {' '}
        <div data-animation="default" data-collapse="all" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" className="nav_mobile_wrap w-nav">
          {' '}
          <div className="nav_mobile_contain">
            {' '}
            <div className="nav_mobile_layout">
              {' '}
              <a aria-label="Home Page" href="/" aria-current="page" className="nav_mobile_logo w-inline-block w--current">
                <div className="u-max-width-full">
                  {' '}
                  <div className="nav_logo w-embed">
                    {' '}
                    <svg width="100%" height="Auto" viewBox="0 0 116 33" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mimu">
                      <rect width="33" height="33" rx="7.5" fill="#FF6B5B" />
                      <svg x="6" y="8.6" width="21" height="15.75" viewBox="0 0 48 36" fill="none">
                        <path d="M2 34 L2 8 Q2 2 8 2 Q14 2 16 8 L24 24 L32 8 Q34 2 40 2 Q46 2 46 8 L46 34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <text x="41" y="24.5" fill="#FF6B5B" fontFamily="'Space Grotesk', Nunito, sans-serif" fontSize="26" fontWeight="600" letterSpacing="-1.2">mimu</text>
                    </svg>
                    {' '}
                  </div>
                </div>
              </a>
              {' '}
              <nav role="navigation" className="nav_mobile_menu_wrap w-nav-menu">
                {' '}
                <div data-lenis-prevent="" className="nav_mobile_menu_scroll">
                  {' '}
                  <nav effect="" aria-label="Main" data-wf--menu--variant="mobile" className="nav_links_component">
                    {' '}
                    <ul role="list" className="nav_links_wrap w-list-unstyled">
                      {' '}
                      <li className="nav_links_item">
                        {' '}
                        <a href="#features" className="nav_links_link w-inline-block">
                          <div className="nav_links_text">
                            {"Recursos"}
                          </div>
                        </a>
                        {' '}
                      </li>
                      {' '}
                      <li className="nav_links_item">
                        {' '}
                        <a href="#pricing" className="nav_links_link w-inline-block">
                          <div className="nav_links_text">
                            {"Preços"}
                          </div>
                        </a>
                        {' '}
                      </li>
                      {' '}
                      <li className="nav_links_item">
                        {' '}
                        <a href="#seguranca" className="nav_links_link w-inline-block">
                          <div className="nav_links_text">
                            {"Segurança"}
                          </div>
                        </a>
                        {' '}
                      </li>
                      {' '}
                      <li className="nav_links_item">
                        {' '}
                        <a href="https://one.pierre.finance/" className="nav_links_link w-inline-block">
                          <div className="nav_links_text">
                            {"Pierre One"}
                          </div>
                        </a>
                        {' '}
                      </li>
                      {' '}
                    </ul>
                    {' '}
                    <div data-wf--spacer--variant="tiny" className="u-section-spacer w-variant-6332f150-e0d7-e14b-7d01-13016a0e1cdf u-ignore-trim" />
                    {' '}
                    <ul role="list" className="nav_actions_wrap w-list-unstyled">
                      {' '}
                      <li className="nav_buttons_item">
                        {' '}
                        <div data-wf--button-main--variant="primary" data-button=" " data-trigger="hover focus" className="button_main_wrap">
                          {' '}
                          <div className="clickable_wrap u-cover-absolute">
                            {' '}
                            <a className="clickable_link w-inline-block" data-subscription-type="" data-cta-name="login_header" href="https://pierre.finance/login" data-link-category="" data-cta-location="lp_header" data-track-event="cta_clicked" data-cta-type="login" data-plan-type="" data-onelink="" data-link-destination="" data-link-page="">
                              <span className="clickable_text u-sr-only">
                                {"Entrar"}
                              </span>
                            </a>
                            {' '}
                          </div>
                          {' '}
                          <div className="button_main_element">
                            {' '}
                            <div aria-hidden="true" className="button_main_text u-weight-medium u-text-style-small u-no-wrap-line">
                              {" Entrar "}
                            </div>
                            {' '}
                            <div className="button_main_icon u-hide-if-empty" />
                            {' '}
                            <div className="button_main_line" />
                            {' '}
                          </div>
                          {' '}
                        </div>
                        {' '}
                      </li>
                      {' '}
                    </ul>
                    {' '}
                  </nav>
                  {' '}
                </div>
                {' '}
              </nav>
              {' '}
              <div effect="" data-state="open" className="nav_button_wrap w-nav-button">
                {' '}
                <div className="nav_button_layout">
                  {' '}
                  <div className="nav_button_line is-1" />
                  {' '}
                  <div className="nav_button_line is-2" />
                  {' '}
                </div>
                {' '}
              </div>
              {' '}
            </div>
            {' '}
          </div>
          {' '}
        </div>
        {' '}
        <div className="nav_dropdown_backdrop" />
        {' '}
        <div className="nav_menu_backdrop" />
        {' '}
        <div className="u-embed-js w-embed w-script">
          {' '}
          {/* script inline #0 -> components/behaviors/ */}
          {' '}
        </div>
        {' '}
      </div>
    </>
  );
}
