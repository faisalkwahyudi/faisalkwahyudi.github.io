document.addEventListener('DOMContentLoaded', () => {
  const img = document.getElementById('profileImg');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const cameraBtn = document.getElementById('cameraBtn');

  // Allow overriding upload endpoint from a global variable for testing
  const UPLOAD_URL = window.PROFILE_UPLOAD_URL || 'http://localhost:3000/upload';

  function setSrcsetAndLoad(){
    const srcset = img.getAttribute('data-srcset');
    if (!srcset) return;
    img.srcset = srcset;
    const fallback = srcset.split(',').pop().trim().split(' ')[0];
    if (fallback) img.src = fallback;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setSrcsetAndLoad();
          img.addEventListener('load', () => {
            img.classList.remove('is-loading'); img.classList.add('is-loaded');
          }, { once: true });
          io.disconnect();
        }
      });
    }, { rootMargin: '100px' });
    io.observe(img);
  } else {
    setSrcsetAndLoad();
    img.classList.remove('is-loading'); img.classList.add('is-loaded');
  }

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async ev => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    previewFile(file);
    await uploadFile(file);
  });

  cameraBtn.addEventListener('click', async () => {
    const captureInput = document.createElement('input');
    captureInput.type = 'file';
    captureInput.accept = 'image/*';
    captureInput.capture = 'environment';
    captureInput.style.display = 'none';
    document.body.appendChild(captureInput);
    captureInput.click();
    captureInput.onchange = async () => {
      const f = captureInput.files && captureInput.files[0];
      if (!f) { captureInput.remove(); return; }
      previewFile(f);
      await uploadFile(f);
      captureInput.remove();
    };
  });

  function previewFile(file){
    const url = URL.createObjectURL(file);
    img.classList.remove('is-loaded'); img.classList.add('is-loading');
    img.src = url;
    img.onload = () => { img.classList.remove('is-loading'); img.classList.add('is-loaded'); URL.revokeObjectURL(url); };
  }

  async function uploadFile(file){
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      // Use absolute URL (default localhost:3000) so testing from different static servers works
      const resp = await fetch(UPLOAD_URL, { method:'POST', body: fd });
      if (!resp.ok) throw new Error('Upload gagal');
      const data = await resp.json();
      if (data && data.url) {
        img.classList.remove('is-loading'); img.classList.add('is-loaded');
        // If server returns a relative path (e.g. /uploads/...), and UPLOAD_URL is absolute, resolve it
        try {
          const url = new URL(data.url, UPLOAD_URL).toString();
          img.src = url;
        } catch (e) {
          img.src = data.url;
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah foto. Coba lagi.');
    }
  }
});
