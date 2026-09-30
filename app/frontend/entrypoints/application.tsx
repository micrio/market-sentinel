import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

void createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<{ default: ResolvedComponent }>('../pages/**/*.tsx', {
      eager: true,
    })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
    }

    return page
  },

  title: (title) => (title ? `${title} · Market Sentinel` : 'Market Sentinel'),

  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <App {...props} />
      </StrictMode>,
    )
  },

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
    },
    future: {
      useScriptElementForInitialPage: true,
      useDataInertiaHeadAttribute: true,
      useDialogForErrorModal: true,
      preserveEqualProps: true,
    },
  },
}).catch((error) => {
  if (document.getElementById('app')) {
    throw error
  }

  console.error('Missing root element.', error)
})
