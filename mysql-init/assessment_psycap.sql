-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 07, 2025 at 10:24 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 7.4.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `assessment_psycap`
--

-- --------------------------------------------------------

--
-- Table structure for table `assessment_results`
--

CREATE TABLE `assessment_results` (
  `id` int(11) NOT NULL,
  `citizenId` varchar(20) NOT NULL,
  `hopeScore` decimal(10,2) DEFAULT NULL,
  `selfEfficacyScore` decimal(10,2) DEFAULT NULL,
  `resilienceScore` decimal(10,2) DEFAULT NULL,
  `optimismScore` decimal(10,2) DEFAULT NULL,
  `hopeAverage` decimal(10,2) DEFAULT NULL,
  `selfEfficacyAverage` decimal(10,2) DEFAULT NULL,
  `resilienceAverage` decimal(10,2) DEFAULT NULL,
  `optimismAverage` decimal(10,2) DEFAULT NULL,
  `overallAverage` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `citizenId` varchar(20) NOT NULL,
  `rank` varchar(100) DEFAULT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `personType` varchar(50) DEFAULT NULL,
  `roster` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `rosterName` varchar(100) DEFAULT NULL,
  `level1Department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `citizenId`, `rank`, `firstName`, `lastName`, `personType`, `roster`, `department`, `rosterName`, `level1Department`, `created_at`, `updated_at`) VALUES
(9, '1520600006178', 'ว่าที่ ร.ต.', 'จักรกฤษณ์', 'สมปาน', 'นายทหาร', 'ประจำแผนกสถิติและประเมิน', 'แผนกสถิติและประเมิน กองเวชสารสนเทศ พร.', 'ประจำแผนกสถิติและประเมิน กวส.พร.', 'พร.', '2025-06-10 08:53:36', '2025-06-11 05:57:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assessment_results`
--
ALTER TABLE `assessment_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_citizen` (`citizenId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `citizenId` (`citizenId`),
  ADD KEY `idx_citizen_id` (`citizenId`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_level1_department` (`level1Department`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assessment_results`
--
ALTER TABLE `assessment_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assessment_results`
--
ALTER TABLE `assessment_results`
  ADD CONSTRAINT `assessment_results_ibfk_1` FOREIGN KEY (`citizenId`) REFERENCES `users` (`citizenId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
