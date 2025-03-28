"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  Clock,
  HeartHandshake,
  AppWindowMac,
  DollarSign,
  ChevronDown,
  Gamepad2,
  Sun,
  Moon,
  LayoutDashboard,
  MessageSquare,
  HeartPulse,
  Home,
  GraduationCap,
  ShoppingBag,
  ActivitySquare,
  ClipboardList,
  Stethoscope,
  Bot,
  Handshake,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const libraries = ["places"];

const specializations = [
  "Gynecology",
  "Obstetrics",
  "Reproductive Endocrinology",
  "Hormonal Therapy",
  "Fertility Specialist",
  "Nutrition & Dietetics",
  "Menstrual Health Specialist",
  "Endometriosis Specialist",
  "Postpartum Care",
];

export function Consultations() {
  const navigate = useNavigate();
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiDoctors, setApiDoctors] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyCIbAtB0SC6j13FLT4RTDDGgMud74q3-5A",
    libraries,
  });

  // Dark mode toggle
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
  };

  // Map handlers
  const onMapLoad = useCallback((map) => setMap(map), []);
  const handleMapDrag = () => {
    if (map) {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat(), lng: center.lng() });
      handleSearch(center);
    }
  };

  // Unified search handler
  const handleSearch = async (location = null) => {
    try {
      setIsSearching(true);
      setSearchError("");
      
      let searchLocation = location || userLocation;
      
      // If we have a search query, geocode it
      if (searchQuery && !location) {
        const geocoder = new window.google.maps.Geocoder();
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: searchQuery }, (results, status) => {
            status === "OK" ? resolve(results) : reject(status);
          });
        });
        
        if (results.length === 0) {
          setSearchError("Location not found");
          setIsSearching(false);
          return;
        }
        
        searchLocation = results[0].geometry.location;
        setUserLocation(searchLocation);
        setMapCenter({ lat: searchLocation.lat(), lng: searchLocation.lng() });
      }

      if (!searchLocation) {
        setSearchError("Please enable location access or enter a location");
        setIsSearching(false);
        return;
      }

      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: searchLocation,
        radius: 50000,
        keyword: "gynecologist",
        type: "doctor",
      };

      service.nearbySearch(request, (results, status) => {
        if (status === "OK" && results.length > 0) {
          const newMarkers = results.map(place => ({
            id: place.place_id,
            name: place.name,
            location: place.geometry.location,
            rating: place.rating,
            address: place.vicinity,
          }));
          
          setMarkers(newMarkers);
          setApiDoctors(results.map(place => ({
            id: place.place_id,
            name: place.name,
            specialization: place.types.includes('doctor') ? 'Gynecologist' : 'Women\'s Health Specialist',
            rating: place.rating || 4.5,
            reviewCount: place.user_ratings_total || 0,
            availableDate: new Date().toISOString().split('T')[0],
            price: Math.floor(Math.random() * 100) + 100,
            image: "/images/women.jpeg",
          })));
        } else {
          setSearchError("No doctors found in this area");
        }
        setIsSearching(false);
      });
    } catch (error) {
      setSearchError("Error searching locations");
      setIsSearching(false);
    }
  };

  // Location handlers
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
          setSearchQuery(""); // Clear search query when using current location
          handleSearch(location);
        },
        (error) => {
          console.error("Error fetching location:", error);
          setSearchError("Please enable location access to use this feature");
        }
      );
    } else {
      setSearchError("Geolocation is not supported by this browser");
    }
  };

  // UI Components
  const SidebarLink = ({ icon, label, onClick, active = false }) => {
    return (
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 w-full px-2 py-2 rounded-lg transition-colors ${
          active
            ? "bg-pink-200 dark:bg-pink-900 text-pink-800 dark:text-pink-200"
            : "text-gray-900 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-gray-700"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };
  const DoctorCard = ({ doctor }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold dark:text-white">{doctor.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">{doctor.specialization}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
          <Star className="h-4 w-4 fill-current text-yellow-400" />
          <span>{doctor.rating}</span>
          <span>({doctor.reviewCount} reviews)</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
          <Clock className="h-4 w-4" />
          <span>Next available: {new Date(doctor.availableDate).toLocaleDateString()}</span>
        </div>
        <button className="w-full bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors duration-300">
          Book Appointment
        </button>
      </div>
    </motion.div>
  );

  const DoctorCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-gray-300 rounded w-full" />
          <div className="h-3 bg-gray-300 rounded w-4/5" />
          <div className="h-3 bg-gray-300 rounded w-3/4" />
        </div>
      </div>
    </div>
  );

  // ... (Keep the DoctorCard and DoctorCardSkeleton components the same as before)

  return (
    <div className={`flex h-screen ${darkMode ? "dark" : ""}`}>
      {/* Sidebar (keep the same as before) */}
      <aside
              className={`bg-pink-100 dark:bg-gray-800 w-64 min-h-screen p-4 fixed transition-all duration-300 ease-in-out ${
                sidebarVisible ? "translate-x-0" : "-translate-x-full"
              }`}
              style={{ zIndex: 40 }}
            >
              <div className="px-4 py-4 flex flex-col space-y-2">
                <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400 ">
                LunaLady AI
                </h1>
                <SidebarLink
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  onClick={() => navigate("/dashboard")}
                />
                <SidebarLink
                  icon={<Home size={20} />}
                  label="Home"
                  onClick={() => navigate("/")}
                  
                />
                <SidebarLink
                  icon={<GraduationCap size={20} />}
                  label="Education"
                  onClick={() => navigate("/blogs")}
                />
                <SidebarLink
                  icon={<ShoppingBag size={20} />}
                  label="Shop"
                  onClick={() => navigate("/Ecom")}
                />
                <SidebarLink
                  icon={<ActivitySquare size={20} />}
                  label="Track Your Health"
                  onClick={() => navigate("/tracker")}
                />
                <SidebarLink
                                      icon={<ClipboardList size={20} />}
                                      label="PCOS Diagnosis"
                                      onClick={() => navigate("/partner")}
                                    />
                <SidebarLink
                  icon={<Stethoscope size={20} />}
                  label="Expert Consultation"
                  onClick={() => navigate("/consultations")}
                  active
                />
                <SidebarLink
                  icon={<Bot size={20} />}
                  label="Eve"
                  onClick={() => navigate("/ChatBot")}
                />
                <SidebarLink
                  icon={<HeartPulse size={20} />}
                  label="HealthLens"
                  onClick={() => navigate("/symptomsanalyzer")}
                />
                <SidebarLink
            icon={<AppWindowMac size={20} />}
            label="Parent's Dashboard"
            onClick={() => navigate("/parents")}
          />
                <SidebarLink
                  icon={<MessageSquare size={20} />}
                  label="Forums"
                  onClick={() => navigate("/forums")}
                />
                <SidebarLink
                  icon={<HeartHandshake size={20} />}
                  label="ShareJoy"
                  onClick={() => 
                    window.open(
                      "https://thepadproject.org/donate/"
                      )  
                    }
                />
                <SidebarLink
                  icon={<Gamepad2 size={20} />}
                  label="Bliss"
                  onClick={() =>
                    window.open(
                      "https://she-syncgame.vercel.app/",
                      "_blank"
                    )
                  }
                />
                <SidebarLink
                  icon={<Handshake size={20} />}
                  label="NGO's"
                  onClick={() =>
                    window.open(
                      "https://www.hercircle.in/engage/wellness/reproductive-health/5-organisations-working-towards-eradicating-period-poverty-2239.html",
                      "_blank"
                    )
                  }
                />
              </div>
            </aside>
             <button
                    onClick={toggleSidebar}
                    className="fixed left-0 top-0 z-10 p-2 bg-pink-600 text-white rounded-r-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
                    style={{
                      transform: sidebarVisible ? "translateX(256px)" : "translateX(0)",
                    }}
                    aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                  >
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-300 ${
                        sidebarVisible ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>
            
      {/* Main content */}

      <main className={`flex-1 p-8 overflow-auto bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out ${
        sidebarVisible ? "ml-64" : "ml-0"
      }`}>
        <div className="container mx-auto py-8 px-4">
          {/* Header (keep the same as before) */}
          <div className="flex justify-between items-center mb-8">
            <motion.h2
              className="text-4xl font-bold text-center text-pink-600 dark:text-pink-400"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Expert Consultations
            </motion.h2>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>


          {/* Enhanced Search Section */}
          {isLoaded && (
            <motion.div
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">
                Find Nearby Gynecologists
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <div className="relative flex items-center">
                    <input
                      id="search"
                      type="text"
                      placeholder="Enter location or 'Near Me'"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-3 pr-24 py-2 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700"
                    />
                    <div className="absolute right-0 flex space-x-1">
                      <button
                        onClick={() => handleSearch()}
                        disabled={isSearching}
                        className="bg-pink-500 text-white px-4 py-2 rounded-r-md hover:bg-pink-600 transition-colors duration-300 disabled:opacity-50"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={getUserLocation}
                  disabled={isSearching}
                  className="bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors duration-300 disabled:opacity-50"
                >
                  <MapPin className="inline-block mr-2 h-4 w-4" />
                  Near Me
                </button>
              </div>

              {searchError && (
                <div className="text-red-500 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {searchError}
                </div>
              )}

              <div className="h-96 w-full rounded-lg overflow-hidden relative">
                {isSearching && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <Loader2 className="animate-spin text-white h-8 w-8" />
                  </div>
                )}
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={12}
                  onLoad={onMapLoad}
                  onDragEnd={handleMapDrag}
                >
                  {markers.map((marker) => (
                    <Marker
                      key={marker.id}
                      position={marker.location}
                      onClick={() => setSelectedMarker(marker)}
                    >
                      {selectedMarker?.id === marker.id && (
                        <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                          <div className="p-2 text-sm">
                            <h3 className="font-semibold">{marker.name}</h3>
                            <p>Rating: {marker.rating || 'N/A'}</p>
                            <p>Address: {marker.address}</p>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}
                </GoogleMap>
              </div>
            </motion.div>
          )}

          {/* Doctors List (keep the same as before) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isSearching ? (
              Array(6).fill().map((_, i) => <DoctorCardSkeleton key={i} />)
            ) : apiDoctors.length > 0 ? (
              apiDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 col-span-full py-8">
                No doctors found. Try adjusting your search criteria.
              </div>
            )}
</div>
        </div>
      </main>
    </div>
  );
}