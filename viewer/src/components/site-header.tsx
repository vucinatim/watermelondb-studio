import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { IconBrandGithub, IconQrcode } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import { useState } from 'react';
import { ConnectDialog } from './connect-dialog';

export function SiteHeader() {
  const [selectedTable] = useQueryState('table');
  const [isConnectDialogOpen, setConnectDialogOpen] = useState(false);

  return (
    <>
      <header className="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium capitalize">
            {selectedTable
              ? selectedTable
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (char) => char.toUpperCase())
              : 'Documents'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConnectDialogOpen(true)}
            >
              <IconQrcode className="mr-2 h-4 w-4" />
              Connect with QR
            </Button>
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="hidden sm:flex"
            >
              <a
                href="https://github.com/vucinatim/watermelondb-studio"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                <IconBrandGithub />
                <span className="hidden sm:block">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </header>
      <ConnectDialog
        open={isConnectDialogOpen}
        onOpenChange={setConnectDialogOpen}
      />
    </>
  );
}
