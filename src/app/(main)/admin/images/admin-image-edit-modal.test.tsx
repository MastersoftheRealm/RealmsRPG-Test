// @vitest-environment happy-dom

import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RealmsImage } from '@/lib/realms-images';
import { AdminImageEditModal } from './admin-image-edit-modal';

const PUBLIC_PREVIEW = 'https://cdn.example.test/library/abc.png';

const sampleImage: RealmsImage = {
  id: 'img-1',
  name: 'Sample',
  categories: ['species'],
  publicUrl: PUBLIC_PREVIEW,
  storagePath: 'library/img-1.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdBy: null,
};

vi.mock('@/lib/realms-images', () => ({
  REALMS_IMAGE_CATEGORY_OPTIONS: [{ value: 'species', label: 'Species' }],
  createRealmsImage: vi.fn(),
  getRealmsImageUsage: vi.fn(async () => ({ usages: [] })),
  replaceRealmsImageFile: vi.fn(),
  updateRealmsImage: vi.fn(),
}));

vi.mock('@/components/patterns', () => ({
  ChipSelect: () => <div data-testid="chip-select" />,
  ListRowThumbnail: ({ src, alt }: { src: string; alt: string }) => (
    <span data-testid="preview-thumb" data-src={src} aria-label={alt} />
  ),
}));

vi.mock('@/components/patterns/chrome/image-upload-modal', () => ({
  ImageUploadModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: (blob: Blob) => void | Promise<void>;
  }) =>
    isOpen ? (
      <button
        type="button"
        data-testid="confirm-crop"
        onClick={() => {
          void onConfirm(new Blob(['pixels'], { type: 'image/png' }));
        }}
      >
        Confirm crop
      </button>
    ) : null,
}));

vi.mock('@/components/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...mod,
    useToast: () => ({ showToast: vi.fn() }),
    Modal: ({
      isOpen,
      title,
      footer,
      children,
    }: {
      isOpen: boolean;
      title?: ReactNode;
      footer?: ReactNode;
      children?: ReactNode;
    }) =>
      isOpen ? (
        <div>
          <div>{title}</div>
          {children}
          {footer}
        </div>
      ) : null,
    Alert: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
    Button: ({
      children,
      onClick,
      disabled,
      type = 'button',
    }: {
      children?: ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      type?: 'button' | 'submit';
    }) => (
      <button type={type} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  };
});

async function cropLocalPreview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Upload & crop' }));
  await user.click(screen.getByTestId('confirm-crop'));
}

describe('AdminImageEditModal local preview object URLs (PAGES2-020)', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-preview');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    cleanup();
  });

  it('revokes the blob preview when the modal closes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AdminImageEditModal
        isOpen
        image={null}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    await cropLocalPreview(user);
    expect(createObjectURLSpy).toHaveBeenCalled();
    revokeObjectURLSpy.mockClear();

    rerender(
      <AdminImageEditModal
        isOpen={false}
        image={null}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:local-preview');
  });

  it('revokes the blob preview on unmount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <AdminImageEditModal
        isOpen
        image={null}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    await cropLocalPreview(user);
    revokeObjectURLSpy.mockClear();

    unmount();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:local-preview');
  });

  it('revokes the previous blob URL when a new crop replaces it', async () => {
    const user = userEvent.setup();
    createObjectURLSpy.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

    render(
      <AdminImageEditModal
        isOpen
        image={null}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    await cropLocalPreview(user);
    revokeObjectURLSpy.mockClear();

    await cropLocalPreview(user);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:first');
    expect(revokeObjectURLSpy).not.toHaveBeenCalledWith(PUBLIC_PREVIEW);
  });

  it('does not revoke the remote public preview URL when closing after edit', async () => {
    const { rerender } = render(
      <AdminImageEditModal
        isOpen
        image={sampleImage}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    expect(screen.getByTestId('preview-thumb').getAttribute('data-src')).toBe(PUBLIC_PREVIEW);

    rerender(
      <AdminImageEditModal
        isOpen={false}
        image={sampleImage}
        onClose={() => {}}
        onSaved={() => {}}
        onRequestDelete={() => {}}
      />,
    );

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });
});
