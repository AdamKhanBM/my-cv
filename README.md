# Adam Khan Navarro — Online CV

Live at: **https://adamkhanbm.github.io/my-cv/**

---

## 📁 Files to upload to GitHub

| File | Description |
|------|-------------|
| `index.html` | Main CV page (required — must be lowercase) |
| `banner-video.mp4` | Background video for the banner |
| `banner.png` | Fallback banner image |
| `1751747985323.png` | Profile photo |

---

## 🚀 How to publish on GitHub Pages (5 minutes)

### Option A — Upload via browser (easiest)

1. Go to [github.com](https://github.com) and log in as **AdamKhanBM**
2. Click **"New repository"** → name it exactly **`my-cv`** → set to **Public** → click **"Create repository"**
3. Click **"uploading an existing file"**
4. Drag and drop these 4 files:
   - `index.html`
   - `banner-video.mp4`
   - `banner.png`
   - `1751747985323.png`
5. Click **"Commit changes"**
6. Go to **Settings → Pages** (left sidebar)
7. Under **"Source"** select **"Deploy from a branch"**
8. Branch: **main** · Folder: **/ (root)** → click **Save**
9. Wait ~1 minute — your CV will be live at:

   > **https://adamkhanbm.github.io/my-cv/**

---

### Option B — Via Git CLI

```bash
git init
git add index.html banner-video.mp4 banner.png 1751747985323.png
git commit -m "Add online CV"
git branch -M main
git remote add origin https://github.com/AdamKhanBM/my-cv.git
git push -u origin main
```
Then enable Pages in Settings as described in step 6–9 above.

---

## ✏️ Updating your CV later

Just edit `index.html` and upload (or push) the updated file.
GitHub Pages will refresh automatically within ~1 minute.

---

## 📋 CV sections

- Summary
- Academic & Research Experience
- Publications (5 papers, 2024–2025)
- Technical Skills
- Presentations & Event Organisation
- Courses & Additional Qualifications
