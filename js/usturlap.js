document.addEventListener('DOMContentLoaded', () => {
    const ekran = document.getElementById('usturlap-ekrani');

    // Tarayıcıdan lokasyon istiyoruz. 
    // İzin verilmezse yedek plan devrede.
    const varsayilanArz = 38.6748; 
    const varsayilanTul = 39.2225;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => hesaplamalariBaslat(position.coords.latitude, position.coords.longitude),
            (error) => {
                console.warn("Konum izni alınamadı, usturlap varsayılan meridyene kilitleniyor.");
                hesaplamalariBaslat(varsayilanArz, varsayilanTul);
            }
        );
    } else {
        hesaplamalariBaslat(varsayilanArz, varsayilanTul);
    }

    function hesaplamalariBaslat(enlem, boylam) {
        // Her saniye verileri güncelleyen saat mekanizması
        guncelle(enlem, boylam);
        setInterval(() => guncelle(enlem, boylam), 1000);
    }

    function guncelle(arz, tul) {
        const simdi = new Date();
        
        // 1. Rasat noktamızı (Observer) kütüphanenin istediği nizamda tanımlıyoruz: Enlem, Boylam, Rakım (0 metre)
        const rasid = new Astronomy.Observer(arz, tul, 0);
        
        // 2. Önce gök cisimlerinin Ekvatoryal (Equator) koordinatlarını alıyoruz
        const semsEkvator = Astronomy.Equator('Sun', simdi, rasid, true, true);
        const kamerEkvator = Astronomy.Equator('Moon', simdi, rasid, true, true);

        // 3. Ekvatoryal koordinatları nihayet Ufuk (Horizon) koordinatlarına çeviriyoruz
        const semsUfuk = Astronomy.Horizon(simdi, rasid, semsEkvator.ra, semsEkvator.dec, 'normal');
        const kamerUfuk = Astronomy.Horizon(simdi, rasid, kamerEkvator.ra, kamerEkvator.dec, 'normal');

        ekran.innerHTML = `
            <div style="margin-bottom: 2.5rem; text-align: center; border-bottom: 1px solid rgba(51, 65, 85, 0.8); padding-bottom: 1.5rem;">
                <span class="osmanlica-terim">Mahal-i Rasat (Gözlem Konumu)</span>
                <div class="bilimsel-veri" style="color: #cbd5e1; margin: 0.5rem 0;">Arz: ${arz.toFixed(4)}° N &nbsp;|&nbsp; Tul: ${tul.toFixed(4)}° E</div>
                <div style="font-size: 0.9rem; color: #64748b; font-weight: bold;">Vakt-i Hâl: ${simdi.toLocaleTimeString('tr-TR')}</div>
            </div>

            <div class="data-row">
                <div class="gok-cismi">ŞEMS (Güneş)</div>
                <div class="koordinat-grubu">
                    <span class="osmanlica-terim">İrtifa-i Kıyasi (Altitude)</span>
                    <span class="bilimsel-veri">${semsUfuk.altitude.toFixed(4)}°</span>
                </div>
                <div class="koordinat-grubu">
                    <span class="osmanlica-terim">Semt-i İtticah (Azimuth)</span>
                    <span class="bilimsel-veri">${semsUfuk.azimuth.toFixed(4)}°</span>
                </div>
            </div>

            <div class="data-row">
                <div class="gok-cismi">KAMER (Ay)</div>
                <div class="koordinat-grubu">
                    <span class="osmanlica-terim">İrtifa-i Kıyasi (Altitude)</span>
                    <span class="bilimsel-veri">${kamerUfuk.altitude.toFixed(4)}°</span>
                </div>
                <div class="koordinat-grubu">
                    <span class="osmanlica-terim">Semt-i İtticah (Azimuth)</span>
                    <span class="bilimsel-veri">${kamerUfuk.azimuth.toFixed(4)}°</span>
                </div>
            </div>
            
            <div style="margin-top: 2rem; font-size: 0.85rem; color: #475569; text-align: center; line-height: 1.5;">
                * İrtifa değeri negatifse, cisim ufuk çizgisinin altındadır.<br>
                Hesaplamalar Astronomy Engine J2000.0 efemeris modeli kullanılarak yapılmaktadır.
            </div>
        `;
    }
});
