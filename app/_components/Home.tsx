'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Film, Check, X, Loader2, Search, Bell, ChevronDown } from 'lucide-react';

interface Movie {
  title: string;
  genres: string;
  backdrop_path?: string;
}

interface TMDBResponse {
  results: {
    backdrop_path: string;
  }[];
}

interface GenreType {
  id: string;
  name: string;
  image: string;
}

const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNzJkNzQ2M2E2YWRkZDRiNmY1Nzg2NDI0MjBiYjJmZCIsIm5iZiI6MTczNjI2OTY0MS42OCwic3ViIjoiNjc3ZDVmNDljNTA3MGI4YTQ2NjZjZWY5Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.VfVdepKdqHpITuRA9PtlpVz1jGGbtDngpAUN4P3E8jk';

const Home = () => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredMovie, setHoveredMovie] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const genres: GenreType[] = [
    { id: 'Action', name: 'Action', image: '/Cover.jpg' },
    { id: 'Comedy', name: 'Comedy', image: '/Cover.jpg' },
    { id: 'Drama', name: 'Drama', image: '/Cover.jpg' },
    { id: 'Sci-Fi', name: 'Sci-Fi', image: '/Cover.jpg' },
    { id: 'War', name: 'War', image: '/Cover.jpg' },
    { id: 'Adventure', name: 'Adventure', image: '/Cover.jpg' }
  ];

  const fetchTMDBBackdrop = async (movieTitle: string): Promise<string | null> => {
    try {
      const cleanTitle = extractCleanTitle(movieTitle);
      const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanTitle)}&include_adult=false&language=en-US&page=1`;
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_API_KEY}`
        }
      });

      const data: TMDBResponse = await response.json();
      if (data.results && data.results.length > 0 && data.results[0].backdrop_path) {
        return `https://image.tmdb.org/t/p/original${data.results[0].backdrop_path}`;
      }
      return null;
    } catch (error) {
      console.error('Error fetching TMDB backdrop:', error);
      return null;
    }
  };

  const fetchMovieBackdrops = async (movies: Movie[]): Promise<Movie[]> => {
    const updatedMovies = await Promise.all(
      movies.map(async (movie) => {
        const backdropPath = await fetchTMDBBackdrop(movie.title);
        return {
          ...movie,
          backdrop_path: backdropPath || '/Cover.jpg'
        };
      })
    );
    return updatedMovies;
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [genreId]
    );
  };

  const handleConfirm = async () => {
    if (selectedGenres.length === 0) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not defined');
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genre: selectedGenres[0],
          top_n: 25
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      const moviesWithBackdrops = await fetchMovieBackdrops(data);
      setRecommendations(moviesWithBackdrops);
      setIsConfirmationOpen(false);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (typeof window !== 'undefined') {
    window.onscroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const extractYearFromTitle = (title: string): string => {
    const match = title.match(/\((\d{4})\)$/);
    return match ? match[1] : '';
  };

  const extractCleanTitle = (title: string): string => {
    return title.replace(/\s*\(\d{4}\)$/, '');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <motion.header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-900' : 'bg-gradient-to-b from-black/80 to-transparent'
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Film className="text-red-600 h-8 w-8" />
            <nav className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-white hover:text-white/80">Home</Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 cursor-pointer hover:text-white/80" />
            <Bell className="w-6 h-6 cursor-pointer hover:text-white/80" />
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-md bg-zinc-800" />
              <ChevronDown className="w-4 h-4 group-hover:text-white/80" />
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 pt-24">
        <AnimatePresence mode="wait">
          {!isConfirmationOpen && recommendations.length === 0 && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.h2
                className="text-5xl font-bold text-center mb-12"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                What genre would you like to watch?
              </motion.h2>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {genres.map((genre) => (
                  <motion.div
                    key={genre.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    className={`relative cursor-pointer h-48 md:h-64 rounded-md overflow-hidden ${selectedGenres.includes(genre.id) ? 'ring-4 ring-red-600' : ''
                      }`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${genre.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-6"
                      whileHover={{ y: -5 }}
                    >
                      <h3 className="font-bold text-3xl">{genre.name}</h3>
                    </motion.div>
                    <AnimatePresence>
                      {selectedGenres.includes(genre.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-4 right-4 bg-red-600 rounded-full p-1"
                        >
                          <Check className="text-white" size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
              {selectedGenres.length > 0 && (
                <motion.div
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-xl rounded-md"
                    onClick={() => setIsConfirmationOpen(true)}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {isConfirmationOpen && (
            <motion.div
              className="space-y-8 max-w-2xl mx-auto mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-4xl font-bold text-center">Confirm Your Genre</h2>
              <motion.div
                className="flex flex-wrap gap-3 justify-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {selectedGenres.map(genreId => {
                  const genre = genres.find(g => g.id === genreId);
                  return (
                    <motion.span
                      key={genreId}
                      variants={itemVariants}
                      className="px-6 py-2 rounded-full bg-red-600 text-white font-medium text-lg"
                    >
                      {genre?.name}
                    </motion.span>
                  );
                })}
              </motion.div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  className='text-black'
                  size="lg"
                  onClick={() => setIsConfirmationOpen(false)}
                >
                  <X className="mr-2" size={20} />
                  Back
                </Button>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 animate-spin" size={20} />
                  ) : (
                    <Check className="mr-2" size={20} />
                  )}
                  Find Movies
                </Button>
              </div>
            </motion.div>
          )}

          {recommendations.length > 0 && (
            <motion.div
              className="space-y-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-3xl font-bold">Top Picks For You</h2>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {recommendations.map((movie) => (
                  <motion.div
                    key={movie.title}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, zIndex: 20 }}
                    className="relative group h-64 rounded-md overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoveredMovie(movie.title)}
                    onMouseLeave={() => setHoveredMovie(null)}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                      style={{ backgroundImage: `url(${movie.backdrop_path})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <AnimatePresence>
                      {hoveredMovie === movie.title && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 p-6 flex flex-col justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-2xl mb-2">{extractCleanTitle(movie.title)}</h3>
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <span className="px-1 py-0.5 border border-gray-400 text-xs">{extractYearFromTitle(movie.title)}</span>
                            </div>
                            <p className="text-sm text-gray-300">Genres: {movie.genres}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="flex justify-center pb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className='text-black'
                  onClick={() => {
                    setSelectedGenres([]);
                    setRecommendations([]);
                  }}
                >
                  Browse More Genres
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Home;