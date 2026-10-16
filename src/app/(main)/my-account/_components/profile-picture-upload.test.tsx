import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AccountProfileCard, PROFILE_PICTURE_UPLOAD_DENIED } from './account-profile-card';

describe('profile picture upload gate (86e3jt56w)', () => {
  it('explains that uploads are not allowed and omits the file-type hint', () => {
    const html = renderToStaticMarkup(
      <AccountProfileCard
        profile={{ role: 'new_player', photoURL: 'https://example.com/p.png' }}
        authProviderLabel="Email/Password"
        uploadingPicture={false}
        pictureMessage={null}
        canUploadProfilePicture={false}
        onOpenPictureModal={() => {}}
        onRemovePicture={() => {}}
      />,
    );
    expect(html).toContain(PROFILE_PICTURE_UPLOAD_DENIED);
    expect(html).toContain('Change Picture');
    expect(html).toContain('Remove Picture');
    expect(html).not.toContain('Max 5MB');
  });

  it('opens the library picker instead of the upload modal when uploads are not allowed', () => {
    const page = readFileSync(path.join(import.meta.dirname, '../page.tsx'), 'utf8');
    expect(page).toContain('model.setShowPictureBank(true)');
    expect(page).toContain('canUploadProfilePicture ?');
  });
});
