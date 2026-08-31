var TRIP = {
  title: TRIP_CONFIG.title,
  subtitle: TRIP_CONFIG.subtitle,
  travelers: TRIP_CONFIG.travelers,
  legs: [
    {
      id: "george-depart",
      location: null,
      date: "Oct 8",
      day: { en: "Thursday", bg: "Четвъртък" },
      title: { en: "George departs Portland", bg: "Георги отпътува от Портланд" },
      flights: [
        {
          airline: "British Airways",
          number: "BA266",
          depart: "PDX 7:30 PM",
          arrive: "LHR 1:00 PM (+1 day)",
          duration: "4h 55min",
          cabin: "Economy"
        },
        {
          airline: "Bulgaria Air",
          number: "FB852",
          depart: "LHR 5:55 PM",
          arrive: "SOF 11:15 PM",
          duration: "3h 20min",
          cabin: "Economy Standard"
        }
      ],
      accommodation: null,
      notes: {
        en: "Fly Portland to London, then London to Sofia. Overnight.",
        bg: "Полет от Портланд до Лондон, след това Лондон до София. Нощен полет."
      },
      thingsToSee: []
    },
    {
      id: "george-arrive-sofia",
      location: { en: "Sofia", bg: "София" },
      date: "Oct 9",
      day: { en: "Friday", bg: "Петък" },
      title: { en: "Arrive in Sofia", bg: "Пристигане в София" },
      flight: null,
      accommodation: {
        name: "Premier Sofia Airport Hotel",
        details: { en: "Near Sofia Airport (SOF).", bg: "В близост до летище София (SOF)." }
      },
      notes: {
        en: "Arrive late at hotel near airport.",
        bg: "Късно пристигане в хотел край летището."
      },
      thingsToSee: []
    },
    {
      id: "george-plovdiv",
      location: { en: "Plovdiv", bg: "Пловдив" },
      date: "Oct 10-15",
      day: { en: "Saturday - Thursday", bg: "Събота - Четвъртък" },
      title: { en: "Travel to Plovdiv, stay with family", bg: "Пътуване до Пловдив, настаняване при семейството" },
      flight: null,
      accommodation: null,
      notes: {
        en: "Travel to Plovdiv. A week with family in George's hometown.",
        bg: "Пътуване до Пловдив. Седмица със семейството в родния град на Георги."
      },
      thingsToSee: []
    },
    {
      id: "harue-depart",
      location: null,
      date: "Oct 15",
      day: { en: "Thursday", bg: "Четвъртък" },
      title: { en: "Harue departs Portland", bg: "Харуе отпътува от Портланд" },
      flights: [
        {
          airline: "British Airways",
          number: "BA266",
          depart: "PDX 7:30 PM",
          arrive: "LHR 1:00 PM (+1 day)",
          duration: "4h 55min",
          cabin: "Economy"
        },
        {
          airline: "Bulgaria Air",
          number: "FB852",
          depart: "LHR 5:55 PM",
          arrive: "SOF 11:15 PM",
          duration: "3h 20min",
          cabin: "Economy Standard"
        }
      ],
      accommodation: null,
      notes: {
        en: "Same flights as George, one week later.",
        bg: "Същите полети като Георги, седмица по-късно."
      },
      thingsToSee: []
    },
    {
      id: "harue-arrive-sofia",
      location: { en: "Sofia", bg: "София" },
      date: "Oct 16",
      day: { en: "Friday", bg: "Петък" },
      title: { en: "Arrive in Sofia", bg: "Пристигане в София" },
      flight: null,
      accommodation: {
        name: "Premier Sofia Airport Hotel",
        details: { en: "Near Sofia Airport (SOF). Reunite with George.", bg: "В близост до летище София (SOF). Събиране с Георги." }
      },
      notes: {
        en: "Both sleep at airport hotel. Leave for Melnik in the morning.",
        bg: "И двамата спят в хотела край летището. На сутринта за Мелник."
      },
      thingsToSee: []
    },
    {
      id: "melnik",
      location: { en: "Melnik", bg: "Мелник" },
      date: "Oct 17",
      day: { en: "Saturday", bg: "Събота" },
      title: { en: "Sofia to Melnik -- meet family, wine", bg: "София до Мелник -- среща със семейството, вино" },
      flight: null,
      drive: { from: { en: "Sofia", bg: "София" }, to: { en: "Melnik", bg: "Мелник" }, duration: "2h 45min" },
      accommodation: {
        name: "Guest House Holiday",
        details: { en: "3-bedroom apartment in Melnik. Stay with family.", bg: "3-стаен апартамент в Мелник. Настаняване със семейството." }
      },
      notes: {
        en: "Drive from Sofia to Melnik (approx. 2h 45min). Meet family. Try local Melnik wine.",
        bg: "Пътуване от София до Мелник (около 2ч 45мин). Среща със семейството. Опит на местното мелнишко вино."
      },
      pullquote: {
        en: "Melnik is Bulgaria's smallest town, tucked in a valley of sand pyramids and vineyards.",
        bg: "Мелник е най-малкият град в България, скътан в долина от пясъчни пирамиди и лозя."
      },
      thingsToSee: [
        {
          name: { en: "Kordopulov House", bg: "Кордопуловата къща" },
          info: { en: "18th century wine merchant house with the largest historic wine cellar in the region. Wine tastings available.", bg: "Къща от 18 век на винен търговец с най-голямата историческа винарска изба в региона. Дегустации на вино." }
        },
        {
          name: { en: "Melnik Wine Museum", bg: "Винен музей Мелник" },
          info: { en: "Walkable in town. Local wines on display with tastings.", bg: "Пешеходно разстояние в града. Местни вина с дегустации." }
        },
        {
          name: { en: "Zindan Cellar", bg: "Зиндан изба" },
          info: { en: "Ottoman-era underground cellar, atmospheric with wine tastings.", bg: "Подземна изба от османско време, атмосферна с дегустации на вино." }
        }
      ]
    },
    {
      id: "melnik-sightseeing",
      location: { en: "Melnik", bg: "Мелник" },
      date: "Oct 18",
      day: { en: "Sunday", bg: "Неделя" },
      title: { en: "Melnik sightseeing, drive to Plovdiv", bg: "Разглеждане на Мелник, пътуване до Пловдив" },
      flight: null,
      drive: { from: { en: "Melnik", bg: "Мелник" }, to: { en: "Plovdiv", bg: "Пловдив" }, duration: "2h" },
      accommodation: null,
      notes: {
        en: "See the sights in Melnik, stop at Rila Monastery on the way, then drive to Plovdiv (approx. 2h). Stay with family.",
        bg: "Разглеждане на забележителностите в Мелник, спирка в Рилския манастир по пътя, след това пътуване до Пловдив (около 2ч). Настаняване при семейството."
      },
      thingsToSee: [
        {
          name: { en: "Rila Monastery", bg: "Рилски манастир" },
          info: { en: "UNESCO World Heritage, on the route toward Sofia. Bulgaria's largest monastery, founded in the 10th century, famous for its 19th-century frescoes and Hrelyo's Tower.", bg: "Обект на ЮНЕСКО, по пътя към София. Най-големият манастир в България, основан през 10 век, известен с фреските си от 19 век и Хрельовата кула." }
        },
        {
          name: { en: "Melnik Earth Pyramids", bg: "Мелнишки пирамиди" },
          info: { en: "Surreal sandstone rock formations surrounding the town. Great for photos and hiking.", bg: "Невероятни пясъчни скални образувания около града. Идеални за снимки и преходи." }
        },
        {
          name: { en: "Rozhen Monastery", bg: "Роженски манастир" },
          info: { en: "6km from Melnik. Largest active monastery in Pirin with stunning frescoes.", bg: "На 6км от Мелник. Най-големият действащ манастир в Пирин с впечатляващи стенописи." }
        },
        {
          name: { en: "Despot Slav's Fortress", bg: "Крепостта на Десислав" },
          info: { en: "Medieval ruins with panoramic views. Small museum inside.", bg: "Средновековни руини с панорамни гледки. Малък музей вътре." }
        },
        {
          name: { en: "St. Nicholas Church", bg: "Църква Свети Никола" },
          info: { en: "Historic church in the town center.", bg: "Историческа църква в центъра на града." }
        },
        {
          name: { en: "Villa Melnik Winery", bg: "Винарна Вила Мелник" },
          info: { en: "Top 50 wineries in the world. 300ha of vineyards. Need car (~4km).", bg: "Топ 50 винарни в света. 300дка собствени лозя. Нужна е кола (~4км)." }
        }
      ]
    },
    {
      id: "plovdiv-family",
      location: { en: "Plovdiv", bg: "Пловдив" },
      date: "Oct 19-21",
      day: { en: "Monday - Wednesday", bg: "Понеделник - Сряда" },
      title: { en: "Plovdiv -- time with family", bg: "Пловдив -- време със семейството" },
      flight: null,
      accommodation: null,
      notes: {
        en: "Relaxing days with family in Plovdiv.",
        bg: "Спокойни дни със семейството в Пловдив."
      },
      thingsToSee: []
    },
    {
      id: "outing-father",
      location: { en: "Plovdiv", bg: "Пловдив" },
      date: "Oct 21",
      day: { en: "Wednesday", bg: "Сряда" },
      title: { en: "Outing with father", bg: "Излизане с баща" },
      flight: null,
      accommodation: {
        name: "TBD",
        details: { en: "Hotel to be confirmed.", bg: "Хотел за потвърждение." }
      },
      notes: {
        en: "Day out with father. Hotel details to be confirmed.",
        bg: "Ден с бащата. Детайлите за хотела предстоят да бъдат потвърдени."
      },
      thingsToSee: []
    },
    {
      id: "family-oct22",
      location: { en: "Plovdiv", bg: "Пловдив" },
      date: "Oct 22",
      day: { en: "Thursday", bg: "Четвъртък" },
      title: { en: "Plovdiv -- time with family", bg: "Пловдив -- време със семейството" },
      flight: null,
      accommodation: null,
      notes: {
        en: "Relaxing day with family in Plovdiv.",
        bg: "Спокойен ден със семейството в Пловдив."
      },
      thingsToSee: []
    },
    {
      id: "fathers-birthday",
      location: { en: "Plovdiv", bg: "Пловдив" },
      date: "Oct 23",
      day: { en: "Friday", bg: "Петък" },
      title: { en: "Father's birthday", bg: "Рожден ден на бащата" },
      flight: null,
      accommodation: null,
      notes: {
        en: "Celebrate father's birthday.",
        bg: "Празнуване на рожден ден на бащата."
      },
      thingsToSee: []
    },
    {
      id: "dinner-mom",
      location: { en: "Sofia", bg: "София" },
      date: "Oct 24",
      day: { en: "Saturday", bg: "Събота" },
      title: { en: "Lunch with Mom, dinner with Krasi in Sofia", bg: "Обяд с Мама, вечеря с Краси в София" },
      flight: null,
      drive: { from: { en: "Plovdiv", bg: "Пловдив" }, to: { en: "Sofia", bg: "София" }, duration: "2h" },
      accommodation: {
        name: "B1 Downtown Hotel Sofia",
        details: { en: "Downtown Sofia for early morning flight.", bg: "В центъра на София за ранен полет." }
      },
      notes: {
        en: "Lunch with Mom in Plovdiv, then drive to Sofia for dinner with Krasi. Stay at B1 Downtown Hotel.",
        bg: "Обяд с Мама в Пловдив, след това пътуване до София за вечеря с Краси. Настаняване в B1 Downtown Hotel."
      },
      thingsToSee: []
    },
    {
      id: "return",
      location: null,
      date: "Oct 25",
      day: { en: "Sunday", bg: "Неделя" },
      title: { en: "Fly back to Portland", bg: "Обратен полет за Портланд" },
      flights: [
        {
          airline: "Bulgaria Air",
          number: "FB851",
          depart: "SOF 6:20 AM",
          arrive: "LHR 7:50 AM",
          duration: "3h 30min",
          cabin: "Economy Standard"
        },
        {
          airline: "British Airways",
          number: "BA267",
          depart: "LHR 1:35 PM",
          arrive: "PDX 4:50 PM",
          duration: "10h 15min",
          cabin: "Economy"
        }
      ],
      accommodation: null,
      notes: {
        en: "Fly home via London Heathrow.",
        bg: "Полет до дома през Лондон Хийтроу."
      },
      thingsToSee: []
    }
  ]
};
