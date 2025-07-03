-- General migration script for jobs and ai_results tables
-- This script will create the current schema from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (CASCADE removes dependencies)
DROP TABLE IF EXISTS ai_results CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Create jobs table with UUID primary key
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_results table with UUID foreign key
CREATE TABLE ai_results (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    price DECIMAL(10,2),
    date DATE,
    uploader_name VARCHAR(255),
    raw_ocr TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_data ON jobs USING GIN(job_data);
CREATE INDEX idx_ai_results_job_id ON ai_results(job_id);

-- Show the final schema
\echo '=== JOBS TABLE SCHEMA ==='
\d jobs

\echo '=== AI_RESULTS TABLE SCHEMA ==='
\d ai_results

\echo '=== ALL TABLES ==='
\dt 


-- Run the migration
    -- docker exec -i postgres psql -U postgres_user -d postgres_db < setup-current-schema.sql