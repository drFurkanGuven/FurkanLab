document.addEventListener('DOMContentLoaded', () => {
    const ekran = document.getElementById('usturlap-ekrani');

    // Tarayıcıdan lokasyon istiyoruz. 
    // Kullanıcı izin vermezse diye harika bir yedek plan: Elazığ koordinatları!
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
        
        // Astronomy Engine ile anlık ufuk koordinatlarını (Altitude & Azimuth) hesaplıyoruz
        const semsUfuk = Astronomy.Horizon(simdi, undefined, arz, tul, 'Sun');
        const kamerUfuk = Astronomy.Horizon(simdi, undefined, arz, tul, 'Moon');

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
