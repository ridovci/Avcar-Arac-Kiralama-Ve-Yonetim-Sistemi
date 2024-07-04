import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-recommender-ai',
  templateUrl: './recommender-ai.component.html',
  styleUrl: './recommender-ai.component.css'
})
export class RecommenderAiComponent {

  text:any;
  content: any;
  content2: any;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=;

  constructor(private http: HttpClient) { }

  generateContent() {
    const user = {
      age: 44,
      gender: 'kadın',
      city: 'rize',
      features: 'kadınlara uygun, sigara içilmemiş, şehirlere arası seyehat uzun yol yapacağım',
      rentalDays: 5,
      carList: [
        'Audi A3 - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - Hatchback - Klimalı',
        'Toyota RAV4 - Benzinli - Manuel Vites - 2024 Model - 5 Kişilik - SUV - Klimalı',
        'BMW 3 Serisi - Benzinli - Otomatik Vites - 2023 Model - 5 Kişilik - Sedan - Klimalı',
        'Mercedes-Benz C-Class - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - Sedan - Klimalı',
        'Ford Focus - Benzinli - Manuel Vites - 2021 Model - 5 Kişilik - Hatchback - Klimalı',
        'Volkswagen Golf - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - Hatchback - Klimalı',
        'Nissan Qashqai - Benzinli - Otomatik Vites - 2023 Model - 5 Kişilik - SUV - Klimalı',
        'Hyundai i20 - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - Hatchback - Klimalı',
        'Honda Civic - Benzinli - Otomatik Vites - 2024 Model - 5 Kişilik - Sedan - Klimalı',
        'Renault Clio - Dizel - Manuel Vites - 2021 Model - 5 Kişilik - Hatchback - Klimalı',
        'Peugeot 3008 - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - SUV - Klimalı',
        'Kia Sportage - Dizel - Otomatik Vites - 2023 Model - 5 Kişilik - SUV - Klimalı',
        'Opel Corsa - Benzinli - Manuel Vites - 2021 Model - 5 Kişilik - Hatchback - Klimalı',
        'Fiat Egea - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - Sedan - Klimalı',
        'Skoda Octavia - Benzinli - Otomatik Vites - 2023 Model - 5 Kişilik - Sedan - Klimalı',
        'Seat Leon - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - Hatchback - Klimalı',
        'Mitsubishi ASX - Benzinli - Otomatik Vites - 2021 Model - 5 Kişilik - SUV - Klimalı',
        'Volvo XC40 - Dizel - Otomatik Vites - 2023 Model - 5 Kişilik - SUV - Klimalı',
        'Jaguar XE - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - Sedan - Klimalı',
        'Land Rover Discovery - Dizel - Otomatik Vites - 2024 Model - 7 Kişilik - SUV - Klimalı',
        'Subaru Impreza - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - Hatchback - Klimalı',
        'Mini Cooper - Benzinli - Otomatik Vites - 2023 Model - 4 Kişilik - Hatchback - Klimalı',
        'Lexus RX - Hibrit - Otomatik Vites - 2021 Model - 5 Kişilik - SUV - Klimalı',
        'Porsche Cayenne - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - SUV - Klimalı',
        'Tesla Model 3 - Elektrikli - Otomatik Vites - 2023 Model - 5 Kişilik - Sedan - Klimalı',
        'Alfa Romeo Giulia - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - Sedan - Klimalı',
        'Citroen C3 - Dizel - Otomatik Vites - 2021 Model - 5 Kişilik - Hatchback - Klimalı',
        'Dacia Sandero - Benzinli - Manuel Vites - 2024 Model - 5 Kişilik - Hatchback - Klimalı',
        'Infiniti Q50 - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - Sedan - Klimalı',
        'Jeep Renegade - Benzinli - Otomatik Vites - 2023 Model - 5 Kişilik - SUV - Klimalı',
        'Lada Niva - Benzinli - Manuel Vites - 2021 Model - 5 Kişilik - SUV - Klimalı',
        'Mazda CX-5 - Dizel - Otomatik Vites - 2022 Model - 5 Kişilik - SUV - Klimalı',
        'Renault Megane - Benzinli - Otomatik Vites - 2023 Model - 5 Kişilik - Hatchback - Klimalı',
        'Seat Arona - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - SUV - Klimalı',
        'Smart ForTwo - Benzinli - Otomatik Vites - 2021 Model - 2 Kişilik - Hatchback - Klimalı',
        'SsangYong Korando - Dizel - Otomatik Vites - 2024 Model - 5 Kişilik - SUV - Klimalı',
        'Suzuki Vitara - Benzinli - Otomatik Vites - 2022 Model - 5 Kişilik - SUV - Klimalı'
      ]
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      "contents": [{
        "parts": [{
          "text": `${user.age} yaşındayım, cinsiyetim ${user.gender}, ${user.city} şehrinde ${user.rentalDays} gün araç kiralayacağım. Önceliklerim: ${user.features}. Lütfen aşağıdaki listeden bir araç önerin: ${user.carList.join(', ')} 
          Cevap sadece araç adı ve açıklama şeklinde JSON formatında olsun. Başka türlü cevap vermeni yasaklıyorum.
          {
          "Araç": "seçilen araç id numarası",
          "Açıklama": "uzun ve bilgilendirici açıklama"
          }
          Hiçbir şekilde başka bir ekleme yapmanı istemiyorum. Cevabın yani çıktın tamamen bu formata olsun.
          `
        }]
      }]
    };


    this.http.post(this.apiUrl, body, { headers }).subscribe(
      (response: any) => {
        try {
          const generatedText = response.candidates[0].content.parts[0].text;
          const icerikObjesi = JSON.parse(generatedText);
          // Araç ve Açıklama bilgilerini değişkenlere aktar
          const aracModeli = icerikObjesi['Araç'];
          const aciklama = icerikObjesi['Açıklama'];
          this.content = aracModeli;
          this.content2 = aciklama;
        } catch (error) {
          console.error('Hata işleme yanıtı:', error);
        }
      },
      (error) => {
        console.error('Hata işleme yanıtı:', error);
      }
    );


  }

}
