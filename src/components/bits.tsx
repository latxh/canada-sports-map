import type {ReactNode} from 'react';
import {Badge} from '@astryxdesign/core/Badge';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack} from '@astryxdesign/core/HStack';
import type {TeamStatus} from '../data';

export function StatusBadge({status}: {status: TeamStatus}) {
  if (status === 'current') return <Badge variant="success" label="Active" />;
  if (status === 'relocated') return <Badge variant="warning" label="Relocated" />;
  return <Badge variant="neutral" label="Defunct" />;
}

export function SectionTitle({children, endContent}: {children: ReactNode; endContent?: ReactNode}) {
  return (
    <HStack gap={2} hAlign="between" vAlign="center" paddingBlockStart={2}>
      <Heading level={3} color="secondary" className="text-xs uppercase tracking-wider">
        {children}
      </Heading>
      {endContent}
    </HStack>
  );
}
