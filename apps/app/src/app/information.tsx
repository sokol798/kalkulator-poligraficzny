import { Linking } from 'react-native';

import { Card, PillButton, Screen, SectionLabel, StackHeader, Text } from '@/components/ui';

const contactEmail = 'kontakt.kalkulator@gmail.com';

export default function InformationScreen() {
  return (
    <Screen header={<StackHeader title="Prywatność i zasady" />}>
      <Card>
        <SectionLabel>Korzystanie z kalkulatora</SectionLabel>
        <Text>Kalkulator jest bezpłatny i działa bez konta. W przeglądarce wymaga JavaScriptu. Korzystanie można zakończyć, zamykając stronę.</Text>
        <Text>Wyniki służą do planowania druku. Przed zakupem papieru lub uruchomieniem produkcji sprawdź wymiary i marginesy z drukarnią. Koszt obejmuje papier według podanej ceny za arkusz.</Text>
        <Text>Zgłoszenie błędu lub reklamację można wysłać na adres {contactEmail}. W zgłoszeniu wystarczy opisać problem i podać parametry potrzebne do jego odtworzenia.</Text>
      </Card>
      <Card>
        <SectionLabel>Dane i prywatność</SectionLabel>
        <Text>Obliczenia wykonują się na urządzeniu. Przeglądarka może przechowywać ostatnie parametry, ustawienia, własne formaty i zapisaną historię. Dane usuniesz w ustawieniach kalkulatora lub w ustawieniach przeglądarki.</Text>
        <Text>Stronę udostępnia GitHub Pages. GitHub informuje, że zapisuje adresy IP odwiedzających w celach bezpieczeństwa.</Text>
        <Text>Po wybraniu udostępniania wynik przekazujesz do wybranej aplikacji lub kopiujesz do schowka. PDF i CSV mogą zawierać wpisaną nazwę zlecenia.</Text>
        <Text>Wiadomość kontaktową wraz z adresem nadawcy otrzymuje skrzynka obsługiwana przez Gmail. Te dane służą do odpowiedzi i obsługi zgłoszenia. Pytania dotyczące prywatności możesz wysłać na ten sam adres.</Text>
        <PillButton kind="secondary" title="Napisz e-mail" onPress={() => void Linking.openURL(`mailto:${contactEmail}`)} />
      </Card>
    </Screen>
  );
}
