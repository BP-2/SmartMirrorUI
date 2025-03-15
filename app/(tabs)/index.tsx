import { Image, StyleSheet, Platform, View, Text, ScrollView, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { LineChart } from 'react-native-chart-kit';
import * as Localize from "react-native-localize";

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const styles = StyleSheet.create({
  smartMirrorView: {
    flex: 1,
    backgroundColor: 'black',
  },
  chartContainer: {
    marginVertical: 16,
    paddingBottom: 16, 
  },
  scrollViewContent: {
    flexGrow: 1,
    marginTop: 20,
    marginLeft: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'black',
  },
  whiteText: {
    color: 'white',
    backgroundColor: 'black',
    paddingBottom: 30,
    fontSize:30,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },

});

interface ForecastPeriod {
  temperature: number;
  shortForecast: string;
  startTime: string;
  probabilityOfPrecipitation: { value: number | null };
}

export default function HomeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState('Fetching weather...');
  const [holiday, setHoliday] = useState('');
  const [temperatureData, setTemperatureData] = useState<number[]>([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76]);
  const [precipitationData, setPrecipitationData] = useState<number[]>([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 0]); 
  const [timeLabels, setTimeLabels] = useState<string[]>(['12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00']); 

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const fetchWeather = async (): Promise<void> => {
      try {
        const getWeatherData = async (latitude: number, longitude: number): Promise<void> => {
          const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`);
          if (!pointsResponse.ok) throw new Error('Error fetching NOAA grid points');
        
          const pointsData = await pointsResponse.json();
          const hourlyForecastUrl: string = pointsData.properties.forecastHourly;
        
          const forecastResponse = await fetch(hourlyForecastUrl);
          if (!forecastResponse.ok) throw new Error('Error fetching NOAA hourly forecast');
        
          const forecastData = await forecastResponse.json();
          const periods: ForecastPeriod[] = forecastData.properties.periods.slice(0, 12);
        
          const temps = periods.map((p) =>
            Number.isFinite(p.temperature) ? p.temperature : 0
          );
          const precip = periods.map((p) =>
            Number.isFinite(p.probabilityOfPrecipitation.value) ? p.probabilityOfPrecipitation.value || 0 : 0
          );
          const times = periods.map((p) => new Date(p.startTime).getHours());
          const formattedTimes = times.map((hour, index) =>
            index % 4 === 0 ? `${hour}:00` : ''
          );

          setTemperatureData(temps);
          setPrecipitationData(precip);
          setTimeLabels(formattedTimes);

          setWeather(periods[0].shortForecast); 
        };

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const fallbackLatitude = 40.7128;
          const fallbackLongitude = -74.0060;
          await getWeatherData(fallbackLatitude, fallbackLongitude);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        await getWeatherData(latitude, longitude);
      } catch (error) {
        setWeather('Unable to fetch weather.');
      }
    };

    const fetchHoliday = async (): Promise<void> => {
      try {
        const getHolidayData = async (date: Date, countryCode: string): Promise<void> => {
          const datesResponse = await fetch(`https://date.nager.at/api/v3/publicholidays/${date.getFullYear()}/${countryCode}`);
          if (!datesResponse.ok) throw new Error('Error fetching public holidays');

          const datesList = await datesResponse.json();
          const formattedDate = date.toISOString().split("T")[0];
          const todaysHoliday = datesList.find(h => h.date === formattedDate);
          if (!todaysHoliday) { return; }

          setHoliday(todaysHoliday.name);
        };

        await getHolidayData(currentTime, Localize.getCountry());
      } catch (error) {
        console.log('error:',error);
        setHoliday('');
      }
    };

    fetchWeather();
    fetchHoliday();
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 18) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString();

  return (
    <ScrollView
      style={styles.smartMirrorView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.whiteText}>{getGreeting()}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          The time is {formattedTime}.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          The date is {formattedDate}.
        </ThemedText>
      </ThemedView>
      {holiday !== '' && <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          Happy {holiday}!
        </ThemedText>
      </ThemedView>}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          The weather is {weather}.
        </ThemedText>
      </ThemedView>

      <View style={styles.chartContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          Temperature (Next 12 Hours)
        </ThemedText>
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [{ data: temperatureData }],
          }}
          width={Dimensions.get('window').width - 32}
          height={160}
          yAxisSuffix="°F"
          chartConfig={{
            backgroundColor: 'black',
            backgroundGradientFrom: '#000',
            backgroundGradientTo: '#000',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
        />
      </View>

      <View style={styles.chartContainer}>
        <ThemedText type="subtitle" style={styles.whiteText}>
          Precipitation (Next 12 Hours)
        </ThemedText>
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [{ data: precipitationData }],
          }}
          width={Dimensions.get('window').width - 32}
          height={160}
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: 'black',
            backgroundGradientFrom: '#000',
            backgroundGradientTo: '#000',
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
        />
      </View>
    </ScrollView>
  );
}
