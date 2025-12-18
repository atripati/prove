import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Code is required', stdout: '', stderr: 'No code provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Piston API for safe Python execution (public code execution API)
    // Piston is a high-performance code execution engine
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'python',
        version: '3.10',
        files: [
          {
            name: 'main.py',
            content: code,
          },
        ],
        stdin: '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!pistonResponse.ok) {
      const errorText = await pistonResponse.text();
      console.error('Piston API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Code execution service unavailable', 
          stdout: '', 
          stderr: 'The code execution service is temporarily unavailable. Please try again later.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await pistonResponse.json();
    console.log('Piston execution result:', JSON.stringify(result));

    // Extract output from Piston response
    const stdout = result.run?.stdout || '';
    const stderr = result.run?.stderr || result.compile?.stderr || '';
    const exitCode = result.run?.code ?? 0;

    return new Response(
      JSON.stringify({
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0 && !stderr,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in run-python function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        stdout: '', 
        stderr: `Execution error: ${errorMessage}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
