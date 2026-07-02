'use client';

/**
 * Design System Styleguide  (/dev/styleguide)
 * ===========================================
 * A single, data-free gallery of every design-system primitive and semantic
 * color token. This is the canonical surface for visual review — both for humans
 * (flip the theme toggle to compare light/dark) and for the automated screenshot
 * suite (Playwright captures this route in light + dark at every breakpoint).
 *
 * It intentionally lives outside the (main)/(auth) route groups so it renders with
 * no header/footer chrome and no authentication or data dependencies. Keep it
 * updated as primitives change — a new component is not "done" until it looks
 * intentional here in BOTH themes.
 */

import * as React from 'react';
import { useTheme } from 'next-themes';
import {
  Button,
  IconButton,
  Input,
  Select,
  Checkbox,
  Textarea,
  SearchInput,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SelectionCard,
  Chip,
  Alert,
  Spinner,
  LoadingState,
  EmptyState,
  TabNavigation,
  TabContentPanel,
  useTabGroup,
  Modal,
  Tooltip,
  PageContainer,
  PageHeader,
  useToast,
} from '@/components/ui';
import { PointStatus } from '@/components/shared/point-status';
import { TabSummarySection, SummaryItem } from '@/components/shared/tab-summary-section';
import { Search, Inbox, Plus, Trash2, Pencil, Settings } from 'lucide-react';

/* ---------------------------------------------------------------- helpers */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-light py-8">
      <h2 className="text-xl font-semibold text-text-primary mb-4 font-display">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-14 w-24 rounded-lg border border-border-light"
        style={{ background: `var(${token})` }}
      />
      <span className="text-[11px] text-text-secondary">{label ?? token.replace('--color-', '')}</span>
    </div>
  );
}

function TextSwatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold" style={{ color: `var(${token})` }}>
        Aa Bb Cc 123
      </span>
      <span className="text-[11px] text-text-secondary">{label ?? token.replace('--color-', '')}</span>
    </div>
  );
}

/** Foreground tokens meant to sit on a solid fill (chip/button), not page background */
function OnFillTextSwatch({
  token,
  fillToken,
  label,
}: {
  token: string;
  fillToken: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-14 w-24 rounded-lg border border-border-light flex items-center justify-center"
        style={{ background: `var(${fillToken})` }}
      >
        <span className="text-base font-semibold" style={{ color: `var(${token})` }}>
          Aa
        </span>
      </div>
      <span className="text-[11px] text-text-secondary">{label ?? token.replace('--color-', '')}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- token sets */

const SURFACE_TOKENS = [
  '--color-background',
  '--color-surface',
  '--color-surface-alt',
  '--color-surface-secondary',
  '--color-card',
];

const TEXT_TOKENS = [
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-title',
];

/** Theme-aware foreground tokens — prefer over numbered ramp + dark: pairs */
const SEMANTIC_FG_TOKENS = [
  '--color-success-fg',
  '--color-danger-fg',
  '--color-warning-fg',
  '--color-info-fg',
  '--color-power-fg',
  '--color-martial-fg',
  '--color-primary-fg',
  '--color-primary-link-fg',
  '--color-primary-outline-fg',
];

/** Solid fills — show as background swatches, not text samples */
const BUTTON_SURFACE_TOKENS = ['--color-primary-button', '--color-danger-button'];

/** Text on solid fills — sample on appropriate background */
const ON_FILL_TEXT_TOKENS: Array<{ token: string; fill: string }> = [
  { token: '--color-primary-chip-fg', fill: '--color-primary-button' },
  { token: '--color-primary-subtle-fg', fill: '--color-primary-subtle-bg' },
];

const BORDER_TOKENS = ['--color-border', '--color-border-light', '--color-border-subtle'];

const PRIMARY_TOKENS = [
  '--color-primary-50',
  '--color-primary-100',
  '--color-primary-200',
  '--color-primary-300',
  '--color-primary-400',
  '--color-primary-500',
  '--color-primary-600',
  '--color-primary-700',
  '--color-primary-800',
  '--color-primary-900',
];

const STATUS_TOKENS = [
  '--color-success',
  '--color-success-light',
  '--color-danger',
  '--color-danger-light',
  '--color-warning',
  '--color-warning-light',
  '--color-info',
  '--color-info-light',
];

const CATEGORY_TOKENS = [
  '--color-category-action',
  '--color-category-activation',
  '--color-category-area',
  '--color-category-duration',
  '--color-category-target',
  '--color-category-special',
  '--color-category-restriction',
];

const GAME_TOKENS = [
  '--color-tp-light',
  '--color-ip-light',
  '--color-currency-light',
  '--color-power-light',
  '--color-martial-light',
  '--color-health-light',
  '--color-energy-light',
  '--color-ally-light',
  '--color-enemy-light',
  '--color-companion-light',
];

const SELECT_OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

/* ---------------------------------------------------------------- page */

export default function StyleguidePage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [checked, setChecked] = React.useState(true);
  const [tab, setTab] = React.useState('overview');
  const [pill, setPill] = React.useState('day');
  const [modalOpen, setModalOpen] = React.useState(false);
  const underlineTabs = useTabGroup('styleguide-underline');
  const pillTabs = useTabGroup('styleguide-pill');

  return (
    <main id="main-content" className="min-h-screen bg-background text-text-primary">
      <PageContainer size="lg" className="pb-12">
        <PageHeader
          title="Design System Styleguide"
          description="Every primitive and token, for visual review in both themes. Data-free and auth-free."
          className="border-b border-border-light pb-6 mb-8"
          actions={
            <Button
              variant="secondary"
              suppressHydrationWarning
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              Toggle theme{resolvedTheme ? ` (${resolvedTheme})` : ''}
            </Button>
          }
        />

        {/* Surfaces */}
        <Section title="Surfaces & Background">
          <Row>
            {SURFACE_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Text */}
        <Section title="Text Colors">
          <Row>
            {TEXT_TOKENS.map((t) => (
              <TextSwatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Semantic foreground (theme-aware) */}
        <Section title="Semantic Foreground (theme-aware)">
          <Row label="Status & archetype text on tinted backgrounds — use text-*-fg, not ramp + dark:">
            {SEMANTIC_FG_TOKENS.map((t) => (
              <TextSwatch key={t} token={t} />
            ))}
          </Row>
          <Row label="Solid button fills — background swatches only">
            {BUTTON_SURFACE_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
          <Row label="Text on solid fills — sample on matching background">
            {ON_FILL_TEXT_TOKENS.map(({ token, fill }) => (
              <OnFillTextSwatch key={token} token={token} fillToken={fill} />
            ))}
          </Row>
        </Section>

        {/* Borders */}
        <Section title="Borders">
          <Row>
            {BORDER_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Primary ramp */}
        <Section title="Primary Ramp">
          <Row>
            {PRIMARY_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Status */}
        <Section title="Status Colors">
          <Row>
            {STATUS_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Category */}
        <Section title="Category Chips (tokens)">
          <Row>
            {CATEGORY_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Game semantic */}
        <Section title="Game Semantic (light backgrounds)">
          <Row>
            {GAME_TOKENS.map((t) => (
              <Swatch key={t} token={t} />
            ))}
          </Row>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">XL</Button>
          </Row>
          <Row label="States">
            <Button isLoading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <Plus /> With icon
            </Button>
          </Row>
          <Row label="Icon buttons">
            <IconButton label="Add" variant="primary">
              <Plus />
            </IconButton>
            <IconButton label="Edit" variant="default">
              <Pencil />
            </IconButton>
            <IconButton label="Delete" variant="danger">
              <Trash2 />
            </IconButton>
            <IconButton label="Settings" variant="ghost">
              <Settings />
            </IconButton>
          </Row>
        </Section>

        {/* Form controls */}
        <Section title="Form Controls">
          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            <Input label="Text input" placeholder="Type here" />
            <Input label="With error" placeholder="Invalid" error="This field is required" />
            <Select label="Select" options={SELECT_OPTIONS} placeholder="Choose one" />
            <div className="flex items-end">
              <SearchInput value={search} onChange={setSearch} placeholder="Search..." showClear />
            </div>
            <Textarea label="Textarea" placeholder="Multi-line input" />
            <div className="flex items-center">
              <Checkbox
                label="Checkbox option"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
            </div>
          </div>
        </Section>

        {/* Chips */}
        <Section title="Chips">
          <Row label="Core">
            <Chip variant="default">Default</Chip>
            <Chip variant="primary">Primary</Chip>
            <Chip onRemove={() => {}}>Removable</Chip>
          </Row>
          <Row label="Category">
            <Chip variant="action">Action</Chip>
            <Chip variant="activation">Activation</Chip>
            <Chip variant="area">Area</Chip>
            <Chip variant="duration">Duration</Chip>
            <Chip variant="target">Target</Chip>
            <Chip variant="special">Special</Chip>
            <Chip variant="restriction">Restriction</Chip>
          </Row>
          <Row label="Status">
            <Chip variant="success">Success</Chip>
            <Chip variant="warning">Warning</Chip>
            <Chip variant="danger">Danger</Chip>
            <Chip variant="info">Info</Chip>
          </Row>
          <Row label="GridListRow list chips">
            <Chip variant="list">List neutral</Chip>
            <Chip variant="listCost">List cost</Chip>
            <Chip variant="listWarning">List warning</Chip>
            <Chip variant="listSuccess">List success</Chip>
            <Chip variant="tp">TP domain</Chip>
          </Row>
          <Row label="Rarity (item creator)">
            <Chip variant="rarityCommon" size="lg">Common</Chip>
            <Chip variant="rarityUncommon" size="lg">Uncommon</Chip>
            <Chip variant="rarityRare" size="lg">Rare</Chip>
            <Chip variant="rarityEpic" size="lg">Epic</Chip>
            <Chip variant="rarityLegendary" size="lg">Legendary</Chip>
            <Chip variant="rarityMythic" size="lg">Mythic</Chip>
            <Chip variant="rarityAscended" size="lg">Ascended</Chip>
          </Row>
          <Row label="Sizes">
            <Chip size="sm">Small</Chip>
            <Chip size="md">Medium</Chip>
            <Chip size="lg">Large</Chip>
          </Row>
        </Section>

        {/* Point status + tab summary (Phase 1.2 shared) */}
        <Section title="Point Status & Tab Summary">
          <Row label="PointStatus variants">
            <PointStatus total={10} spent={3} label="Remaining" />
            <PointStatus total={10} spent={10} variant="compact" />
            <PointStatus total={10} spent={12} label="Over" />
          </Row>
          <Row label="TabSummarySection variants">
            <div className="flex w-full max-w-3xl flex-col gap-3">
              <TabSummarySection variant="default">
                <SummaryItem label="Default" value="42" highlight highlightColor="success" />
              </TabSummarySection>
              <TabSummarySection variant="power">
                <SummaryItem label="Power" value="12" highlight highlightColor="power" />
              </TabSummarySection>
              <TabSummarySection variant="martial">
                <SummaryItem label="Martial" value="8" highlight highlightColor="martial" />
              </TabSummarySection>
              <TabSummarySection variant="currency">
                <SummaryItem label="Currency" value="150" highlight highlightColor="warning" />
              </TabSummarySection>
              <TabSummarySection variant="physical">
                <SummaryItem label="Physical" value="6 ft" highlight highlightColor="primary" />
              </TabSummarySection>
            </div>
          </Row>
        </Section>

        {/* Alerts */}
        <Section title="Alerts">
          <div className="flex flex-col gap-3 max-w-2xl">
            <Alert variant="info" title="Information">An informational message.</Alert>
            <Alert variant="success" title="Success">Your changes were saved.</Alert>
            <Alert variant="warning" title="Warning">Double-check this value.</Alert>
            <Alert variant="danger" title="Error">Something went wrong.</Alert>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Supporting description text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Card body content sits here with the standard padding and radius.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-text-secondary">A minimal card with content only.</p>
              </CardContent>
            </Card>
          </div>
          <Row label="Selection cards">
            <SelectionCard className="max-w-xs text-left">Selectable option</SelectionCard>
            <SelectionCard selected className="max-w-xs text-left">Selected option</SelectionCard>
          </Row>
        </Section>

        {/* Tabs */}
        <Section title="Tab Navigation">
          <Row label="Underline">
            <div className="w-full max-w-xl">
              <TabNavigation
                tabGroupId={underlineTabs.tabGroupId}
                sharedTabPanelId={underlineTabs.sharedPanelId}
                tabs={[
                  { id: 'overview', label: 'Overview', count: 4 },
                  { id: 'details', label: 'Details' },
                  { id: 'history', label: 'History', count: 12 },
                ]}
                activeTab={tab}
                onTabChange={setTab}
              />
              <TabContentPanel
                tabGroupId={underlineTabs.tabGroupId}
                activeTab={tab}
                id={underlineTabs.sharedPanelId}
                className="sr-only"
              >
                {tab} panel
              </TabContentPanel>
            </div>
          </Row>
          <Row label="Pill">
            <TabNavigation
              variant="pill"
              tabGroupId={pillTabs.tabGroupId}
              sharedTabPanelId={pillTabs.sharedPanelId}
              tabs={[
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
              ]}
              activeTab={pill}
              onTabChange={setPill}
            />
            <TabContentPanel
              tabGroupId={pillTabs.tabGroupId}
              activeTab={pill}
              id={pillTabs.sharedPanelId}
              className="sr-only"
            >
              {pill} panel
            </TabContentPanel>
          </Row>
        </Section>

        {/* Loading & empty */}
        <Section title="Loading & Empty States">
          <Row label="Spinners">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
          <Row label="Loading state">
            <div className="w-full max-w-md rounded-xl border border-border-light bg-surface">
              <LoadingState message="Loading content..." size="md" />
            </div>
          </Row>
          <Row label="Empty state">
            <div className="w-full max-w-md rounded-xl border border-border-light bg-surface">
              <EmptyState
                icon={<Inbox className="w-8 h-8" />}
                title="No results found"
                description="Try adjusting your search or filters."
                action={{ label: 'Clear filters', onClick: () => {} }}
              />
            </div>
          </Row>
        </Section>

        {/* Interactive state matrix (VSEA-002) */}
        <Section title="Interactive State Matrix">
          <Row label="Buttons — default / disabled / loading">
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
          </Row>
          <Row label="Form — default / disabled / error">
            <Input label="Enabled" placeholder="Editable" />
            <Input label="Disabled" placeholder="Locked" disabled />
            <Input label="Error" placeholder="Invalid" error="Required field" />
          </Row>
          <Row label="Chips — static / interactive">
            <Chip variant="primary">Static</Chip>
            <Chip variant="primary" interactive>Interactive</Chip>
            <Chip variant="success" onRemove={() => {}}>Removable</Chip>
          </Row>
          <Row label="Tabs — underline (active: {tab})">
            <div className="w-full max-w-xl">
              <TabNavigation
                associatePanels={false}
                tabs={[
                  { id: 'overview', label: 'Overview', count: 4 },
                  { id: 'details', label: 'Details' },
                ]}
                activeTab={tab}
                onTabChange={setTab}
              />
            </div>
          </Row>
          <Row label="Toast — trigger">
            <Button variant="secondary" onClick={() => showToast('Example notification', 'success')}>
              Show toast
            </Button>
          </Row>
          <Row label="Overlays — tooltip + modal trigger">
            <Tooltip content="Tooltip on hover/focus">
              <Button variant="secondary">Tooltip target</Button>
            </Tooltip>
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          </Row>
        </Section>

        {/* Overlays */}
        <Section title="Overlays">
          <Row label="Tooltip">
            <Tooltip content="This is a tooltip">
              <Button variant="secondary">
                <Search /> Hover me
              </Button>
            </Tooltip>
          </Row>
          <Row label="Modal">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example modal"
              description="Modals use the unified Modal primitive."
              size="md"
              fullScreenOnMobile
            >
              <div className="flex flex-col gap-3">
                <p className="text-sm text-text-secondary">
                  This dialog demonstrates the standard modal surface, header, and footer.
                </p>
                <Alert variant="info">Inline alert inside a modal.</Alert>
              </div>
            </Modal>
          </Row>
        </Section>
      </PageContainer>
    </main>
  );
}
