const $ = id => document.getElementById(id);

function baca(key, awal) {
    return JSON.parse(localStorage.getItem(key)) ?? awal;
}

function simpan(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function rupiah(n) {
    return 'Rp' + n.toLocaleString('id-ID');
}

function isi(id, teks) {
    if ($(id)) {
        $(id).textContent = teks; }
}

// Data produk
const produk = {
    'Cabai rawit': [45000, 'Bumbu', 80], 'Tomat': [12000, 'Sayuran'],'Kangkung': [6000, 'Sayuran', 40],'Terong ungu': [10000, 'Sayuran', 25],
    'Bawang merah': [38000, 'Bumbu'],'Pisang kepok': [15000, 'Buah', 35],'Wortel': [11000, 'Umbi', 70],'Jagung manis': [9000, 'Sayuran', 60]
};

const jadwal = {
    sekali: 'Sekali kirim', mingguan: 'Setiap minggu', 'dua-minggu': 'Setiap 2 minggu'
};

// Data akun dan penyimpanan
let akun = baca('dtAkun', []);
let user = baca('dtUser', null);

const pemilik = user ? user.email : 'tamu';
const keyCart = 'dtCart:' + pemilik;
const keyJadwal = 'dtJadwal:' + pemilik;
const keyRiwayat = 'dtRiwayat:' + pemilik;

let cart = baca(keyCart, []);
let riwayat = baca(keyRiwayat, []);

const halaman = location.pathname.split('/').pop();

// Cek apakah pengguna sudah login
if (['katalog.html', 'pembayaran.html', 'pesanan.html'].includes(halaman) && !user) {
    sessionStorage.setItem('dtTujuan', halaman);
    location.replace('login.html');
}

// Registrasi
if ($('registerForm')) {
    $('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const email = $('email').value.trim().toLowerCase();
        const password = $('password').value;

        if (password.length < 6) {
            return alert('Password minimal 6 karakter.');
        }

        if (password !== $('confirmPassword').value) {
            return alert('Konfirmasi password tidak sama.');
        }

        if (akun.some(a => a.email === email)) {
            return alert('Email sudah terdaftar.');
        }

        akun.push({
            nama: $('nama').value.trim(),
            usaha: $('usaha').value.trim(),
            email: email,
            whatsapp: $('whatsapp').value.trim(),
            password: password
        });

        simpan('dtAkun', akun);
        alert('Pendaftaran berhasil! Silakan masuk.');
        location.href = 'login.html';
    });
}

// Login
if ($('loginForm')) {
    $('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const email = $('email').value.trim().toLowerCase();
        const password = $('password').value;

        const a = akun.find(a => a.email === email && a.password === password);

        if (!a) {
            return alert('Email atau password salah.');
        }

        simpan('dtUser', {
            nama: a.nama,
            usaha: a.usaha,
            email: a.email,
            whatsapp: a.whatsapp
        });

        // Memindahkan produk yang dipilih sebelum login
        const pending = baca('dtPending', []);
        const keranjang = baca('dtCart:' + email, []);

        pending.forEach(p => {
            const lama = keranjang.find(k => k.nama === p.nama);
            const max = produk[p.nama][2] ?? Infinity;

            if (lama) {
                lama.jumlah = Math.min(max, lama.jumlah + p.jumlah);
            } else {
                keranjang.push(p);
            }
        });

        simpan('dtCart:' + email, keranjang);
        localStorage.removeItem('dtPending');

        const tujuan = sessionStorage.getItem('dtTujuan');
        sessionStorage.removeItem('dtTujuan');

        if (['katalog.html', 'pesanan.html', 'pembayaran.html'].includes(tujuan)) {
            location.href = tujuan;
        } else {
            location.href = 'katalog.html';
        }
    });
}

// password
var inputPassword = document.getElementById("password");
var togglePassword = document.getElementById("togglePassword");
var iconPassword = document.getElementById("iconPassword");

if (inputPassword && togglePassword && iconPassword) {
    togglePassword.onclick = function() {
        if (inputPassword.type === "password") {
            inputPassword.type = "text";
            iconPassword.className = "bi bi-eye-slash";
        } else {
            inputPassword.type = "password";
            iconPassword.className = "bi bi-eye";
        }
    };
}

// profil pengguna
if (user) {
    document.querySelectorAll('.user-profile strong').forEach(el => {
        el.textContent = user.nama;
    });

    document.querySelectorAll('.user-profile small').forEach(el => {
        el.textContent = user.usaha;
    });
}

// Logout
document.querySelectorAll('.sidebar-logout').forEach(el => {
    el.onclick = function(e) {
        e.preventDefault();
        localStorage.removeItem('dtUser');
        location.href = 'login.html';
    };
});

// Menambahkan produk ke keranjang
function tambahProduk(nama) {
    if (!produk[nama]) {
        return;
    }

    if (!user) {
        simpan('dtPending', [{
            nama: nama,
            harga: produk[nama][0],
            jumlah: 1
        }]);

        location.href = 'login.html';
        return;
    }

    const item = cart.find(p => p.nama === nama);

    if (item) {
        if (item.jumlah >= (produk[nama][2] ?? Infinity)) {
            return alert('Jumlah melebihi stok.');
        }

        item.jumlah++;
    } else {
        cart.push({
            nama: nama,
            harga: produk[nama][0],
            jumlah: 1
        });
    }

    simpan(keyCart, cart);
    tampilCart();
}

// Menambah dan mengurangi jumlah kg
function ubahJumlah(nama, perubahan) {
    if (perubahan > 0) {
        return tambahProduk(nama);
    }

    const item = cart.find(p => p.nama === nama);

    if (!item) {
        return;
    }

    item.jumlah--;

    cart = cart.filter(p => p.jumlah > 0);

    simpan(keyCart, cart);
    tampilCart();
}

// hitung harga pesanan
function hitung() {
    const subtotal = cart.reduce((total, p) => {
        return total + p.harga * p.jumlah;
    }, 0);

    const biaya = Math.round(subtotal * 0.03);
    const total = subtotal + biaya;

    return {
        subtotal: subtotal,
        biaya: biaya,
        total: total
    };
}

// Menampilkan isi keranjang
function tampilCart() {
    if (!$('cartItems')) {
        return;
    }

    $('cartItems').classList.remove('empty-cart');

    $('cartItems').innerHTML = cart.map(p => `
        <article class="cart-item">
            <div class="d-flex justify-content-between">
                <strong>${p.nama}</strong>
                <strong>${rupiah(p.harga * p.jumlah)}</strong>
            </div>
            <small>${rupiah(p.harga)} / kg</small><br>
            <div class="cart-quantity">
                <button type="button" onclick="ubahJumlah('${p.nama}', -1)">−</button>
                <span>${p.jumlah} kg</span>
                <button type="button" onclick="ubahJumlah('${p.nama}', 1)">+</button>
            </div>
        </article>
    `).join('');

    // Jika keranjang kosong
    if (cart.length === 0) {
        $('cartItems').innerHTML = `
            <div class="empty-cart">
                <i class="bi bi-cart3"></i>
                <p>Keranjang masih kosong.<br>Pilih produk dari katalog.</p>
            </div>
        `;
    }

    const h = hitung();

    isi('subtotal', rupiah(h.subtotal));
    isi('biaya', rupiah(h.biaya));
    isi('serviceFee', rupiah(h.biaya));
    isi('total', rupiah(h.total));

    const btn = $('checkoutBtn') || $('checkoutButton');

    if (btn) {
        btn.disabled = cart.length === 0;
    }
}

// ke halaman pembayaran
function lanjutPembayaran() {
    if (cart.length === 0) {
        return;
    }

    simpan(keyJadwal, $('jadwal').value);
    location.href = 'pembayaran.html';
}

// Tombol tambah beranda
document.querySelectorAll('.tambah[data-produk]').forEach(btn => {
    btn.onclick = function() {
        tambahProduk(btn.dataset.produk);

        if (user) {
            location.href = 'katalog.html';
        }
    };
});

// Katalog produk
if ($('cartItems')) {
    const cards = document.querySelectorAll('.katalog-card');

    cards.forEach(card => {
        const nama = card.querySelector('h5').textContent.trim();

        card.querySelector('button').onclick = function() {
            tambahProduk(nama);
        };
    });

    let kategori = 'Semua';

    // Pencarian dan filter produk
    function filter() {
        const cari = $('searchProduk').value.toLowerCase();

        cards.forEach(card => {
            const nama = card.querySelector('h5').textContent.trim();

            const cocokNama = nama.toLowerCase().includes(cari);
            const cocokKategori = kategori === 'Semua' || produk[nama][1] === kategori;

            if (cocokNama && cocokKategori) {
                card.parentElement.classList.remove('d-none');
            } else {
                card.parentElement.classList.add('d-none');
            }
        });
    }

    $('searchProduk').oninput = filter;

    const tombol = document.querySelectorAll('.filter-produk button');

    tombol.forEach(btn => {
        btn.onclick = function() {
            kategori = btn.textContent.trim();
            aktif(tombol, btn);
            filter();
        };
    });

    // Pilihan jadwal pengiriman
    $('jadwal').innerHTML = `
        <option value="sekali">Sekali kirim</option>
        <option value="mingguan">Setiap minggu</option>
        <option value="dua-minggu">Setiap 2 minggu</option>
    `;

    $('jadwal').value = baca(keyJadwal, 'sekali');

    $('jadwal').onchange = function() {
        simpan(keyJadwal, $('jadwal').value);
    };

    //hapus dropdown pembayaran lama 
    if ($('pembayaran')) {
        document.querySelector('label[for="pembayaran"]')?.remove();
        $('pembayaran').remove();
    }

    const btn = $('checkoutBtn') || $('checkoutButton') || document.querySelector('.order-box button:last-child');

    if (btn) {
        btn.id = 'checkoutBtn';
        btn.textContent = 'Lanjut ke pembayaran';
        btn.onclick = lanjutPembayaran;
    }

    tampilCart();
}

function aktif(tombol, pilihan) {
    tombol.forEach(btn => {
        btn.classList.toggle('filter-active', btn === pilihan);
        btn.classList.toggle('btn-outline-dark', btn !== pilihan);
    });
}

//format tanggal
function tanggalLokal(d) {
    const tahun = d.getFullYear();
    const bulan = String(d.getMonth() + 1).padStart(2, '0');
    const tanggal = String(d.getDate()).padStart(2, '0');

    return tahun + '-' + bulan + '-' + tanggal;
}

function formatTanggal(s) {
    return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Halaman pembayaran
if ($('paymentForm') && user) {
    if (cart.length === 0) {
        location.replace('katalog.html');
    }

    // data pengguna 
    $('nama').value = user.nama;
    $('whatsapp').value = user.whatsapp;
    $('frekuensi').value = baca(keyJadwal, 'sekali');

    $('tanggal').min = tanggalLokal(new Date());
    $('tanggal').value = $('tanggal').min;

    //hitung total pembayaran
    const h = hitung();
    const ongkir = cart.length > 0 ? 15000 : 0;
    const total = h.total + ongkir;

    $('checkoutItems').innerHTML = cart.map(p => `
        <p class="d-flex justify-content-between">
            <span>${p.nama} × ${p.jumlah} kg</span>
            <strong>${rupiah(p.harga * p.jumlah)}</strong>
        </p>
    `).join('');

    isi('checkoutSubtotal', rupiah(h.subtotal));
    isi('checkoutFee', rupiah(h.biaya));
    isi('checkoutOngkir', rupiah(ongkir));
    isi('checkoutTotal', rupiah(total));
    isi('paymentTotal', rupiah(total));

 // Memilih metode pembayaran
let metode = '';

const tombol = document.querySelectorAll('.payment-method');

tombol.forEach(function(btn) {
    btn.onclick = function() {
        metode = btn.dataset.method;

        tombol.forEach(function(b) {
            b.classList.remove('active');
        });

        btn.classList.add('active');

        $('paymentDetail').classList.remove('d-none');
        isi('paymentTitle', metode);

        $('payButton').disabled = false;
    };
});
    // Selesaikan pembayaran
    $('paymentForm').onsubmit = function(e) {
        e.preventDefault();

        if (!metode || cart.length === 0) {
            return;
        }

        const sekarang = new Date();

        // Membuat ID pesanan
        const id = 'DT-' +
            tanggalLokal(sekarang).replaceAll('-', '').slice(2) +
            '-' + Date.now().toString().slice(-8);

        // Data transaksi
        const pesanan = { id: id, tanggal: tanggalLokal(sekarang),kirim: $('tanggal').value, produk: cart, 
            jadwal: jadwal[$('frekuensi').value], total: total, metode: metode, status: 'Menunggu konfirmasi'
        };

        // Simpan ke riwayat
        riwayat.unshift(pesanan);
        simpan(keyRiwayat, riwayat);

        // Kosongkan keranjang
        cart = [];
        simpan(keyCart, cart);

        $('payButton').disabled = true;

        // detail transaksi berhasil
        isi('successOrder', id);
        isi('successMethod', metode);
        isi('successTotal', rupiah(total));
        isi('successDate', formatTanggal(pesanan.kirim));

        if (metode === 'COD') {
            $('successModal').querySelector('h3').textContent = 'Pesanan berhasil dibuat';
        } else {
            $('successModal').querySelector('h3').textContent = 'Simulasi transaksi berhasil';
        }

        $('successModal').querySelector('.success-modal > p').textContent =
            'Pesanan demo tersimpan dalam riwayat belanja.';

        // Menampilkan modal Bootstrap
        const modal = new bootstrap.Modal($('successModal'), {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    };
}

// Halaman riwayat pesanan
if ($('riwayatPesanan')) {
    const kosong = $('riwayatPesanan').innerHTML;

    // Menghitung jumlah pesanan
    var totalPesanan = document.getElementById("totalPesanan");
    if (totalPesanan) {
        totalPesanan.textContent = riwayat.length;
}

    // Menampilkan tabel riwayat
    function tampilRiwayat(status) {
        const data = riwayat.filter(p => {
            return status === 'Semua' || p.status === status;
        });

        $('riwayatPesanan').innerHTML = data.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${formatTanggal(p.tanggal)}</td>
                <td>${p.produk.map(k => k.nama + ' × ' + k.jumlah + ' kg').join('<br>')}</td>
                <td>${p.jadwal}<br>
                    <small>${formatTanggal(p.kirim)}</small>
                </td>
                <td>${rupiah(p.total)}</td>
                <td> <span class="badge text-bg-warning">${p.status}</span>
                </td>
            </tr>
        `).join('');

        // Jika riwayat kosong
        if (data.length === 0) {
            if (status === 'Semua') {
                $('riwayatPesanan').innerHTML = kosong;
            } else {
                $('riwayatPesanan').innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">Tidak ada pesanan dengan status ini.</td>
                    </tr>
                `;}
        }
    }

    // Filter status pesanan
    tampilRiwayat('Semua');
}