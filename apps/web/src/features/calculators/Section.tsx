import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible.Root className="border-2 border-line bg-surface">
      <Collapsible.Trigger className="flex min-h-11 w-full items-center justify-between px-3 font-bold [&[data-state=open]>svg]:rotate-180">
        {title} <ChevronDown aria-hidden size={20} />
      </Collapsible.Trigger>
      <Collapsible.Content className="border-t-2 border-line p-3">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
