import { createFileRoute, Outlet } from '@tanstack/react-router'
import * as React from 'react'
import { SaasPublicLayout } from '~/components/layout/saas-public-layout'

export const Route = createFileRoute('/{-$locale}/_public')({
  component: PublicLayoutRoute,
})

function PublicLayoutRoute() {
  return (
    <SaasPublicLayout>
      <Outlet />
    </SaasPublicLayout>
  )
}
