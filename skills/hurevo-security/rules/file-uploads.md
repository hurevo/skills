---
title: File Uploads
impact: HIGH
tags: [security, uploads, mime, storage, exif]
---

# File Uploads

Validate MIME type server-side. Store outside webroot with a random UUID filename. Re-process images through Intervention Image to strip EXIF. Enforce maximum file size at the application layer.

## Why

- **Path traversal and webshell**: Storing files with original names in a public path lets attackers upload `shell.php` or `../../config/app.php`.
- **MIME spoofing**: Checking `Content-Type` header is not enough — it comes from the client. Server-side MIME detection reads the actual file bytes.
- **EXIF data**: Image EXIF can contain GPS coordinates, device serial numbers, and other sensitive metadata. Re-processing strips it.

## Pattern

```php
// Bad — public storage, original filename, no MIME validation, no re-processing
class ProfileController extends Controller
{
    public function updateAvatar(Request $request): JsonResponse
    {
        $path = $request->file('avatar')->store(
            'public/avatars',
            $request->file('avatar')->getClientOriginalName() // path traversal risk
        );
        auth()->user()->update(['avatar_path' => $path]);
        return response()->json(['path' => asset($path)]);
    }
}

// Good — private disk, UUID name, server-side MIME, image re-processed, EXIF stripped
class ProfileController extends Controller
{
    public function updateAvatar(AvatarUploadRequest $request): JsonResponse
    {
        $file = $request->file('avatar');

        // Re-process image: resize, convert to webp, strip EXIF
        $image = Image::read($file)
            ->scale(width: 512, height: 512)
            ->toWebp(quality: 85);

        $filename = Str::uuid() . '.webp';
        $path     = 'avatars/' . $filename;

        Storage::disk('private')->put($path, $image);

        auth()->user()->update(['avatar_path' => $path]);

        return response()->json([
            'url' => Storage::disk('private')->temporaryUrl($path, now()->addHour()),
        ]);
    }
}

// app/Http/Requests/AvatarUploadRequest.php
class AvatarUploadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',
                'max:5120',                   // 5 MB hard limit
                'mimes:jpg,jpeg,png,webp',    // server-side MIME check
                new NoSvgUpload(),             // custom rule: reject SVGs
            ],
        ];
    }
}
```

```php
// Generating a signed URL for private file access
public function show(Request $request): JsonResponse
{
    $user = auth()->user();
    $url  = Storage::disk('private')->temporaryUrl(
        $user->avatar_path,
        now()->addMinutes(15)
    );
    return response()->json(['url' => $url]);
}
```

## Rules

1. Validate MIME type server-side using `mimes:` validation rule — it reads the file bytes, not the client-supplied Content-Type header.
2. Store all uploaded files on the `private` disk — never in `storage/app/public/` unless direct public access is explicitly required.
3. Always rename uploaded files to `Str::uuid() . '.' . $extension` — never preserve the client's original filename.
4. Re-process all uploaded images through Intervention Image (`Image::read()`) — this strips EXIF, normalises orientation, and converts to a safe format.
5. Enforce a maximum file size in the validation rule (`max:5120` for 5MB) and also at the web server level in nginx config.
6. Serve private files via `Storage::temporaryUrl()` with a short expiry (15 minutes for display, 1 hour for downloads) — never serve direct storage paths.
7. Reject SVG uploads unless explicitly required — SVGs can contain embedded JavaScript.
