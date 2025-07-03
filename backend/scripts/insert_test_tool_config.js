const { supabase } = require('../src/config/supabase');
const { logger } = require('../src/config/logger');

async function insertTestToolConfig() {
  try {
    console.log('Inserting test Google Calendar tool configuration...');

    const company_id = 'b3a660b5-2cc4-4fb0-91f7-681ca1365592';
    const tool_name = 'google_calendar';
    const tool_type = 'calendar';
    
    // Generate unique tool_id
    const tool_id = `${tool_type}_${company_id}_${Date.now()}`;
    
    // Test configuration as requested
    const config = {
      client_id: "test_client_id",
      client_secret: "test_client_secret", 
      refresh_token: "test_refresh_token",
      calendar_id: "primary"
    };

    // Insert the test configuration
    const { data: toolConfig, error } = await supabase
      .from('tools_config')
      .insert({
        company_id: company_id,
        tool_id: tool_id,
        tool_name: tool_name,
        tool_type: tool_type,
        enabled: true,
        credentials: JSON.stringify(config),
        custom_config: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting tool configuration:', error);
      throw error;
    }

    console.log('✅ Test tool configuration inserted successfully!');
    console.log('Configuration details:');
    console.log(`- ID: ${toolConfig.id}`);
    console.log(`- Tool ID: ${toolConfig.tool_id}`);
    console.log(`- Company ID: ${toolConfig.company_id}`);
    console.log(`- Tool Name: ${toolConfig.tool_name}`);
    console.log(`- Tool Type: ${toolConfig.tool_type}`);
    console.log(`- Enabled: ${toolConfig.enabled}`);
    console.log(`- Created At: ${toolConfig.created_at}`);
    
    // Verify the insertion by querying it back
    console.log('\nVerifying insertion...');
    const { data: verification, error: verifyError } = await supabase
      .from('tools_config')
      .select('*')
      .eq('company_id', company_id)
      .eq('tool_name', tool_name);

    if (verifyError) {
      console.error('Error verifying insertion:', verifyError);
      return;
    }

    console.log(`✅ Verification successful! Found ${verification.length} matching record(s).`);
    
    return toolConfig;

  } catch (error) {
    console.error('Failed to insert test tool configuration:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  insertTestToolConfig()
    .then(() => {
      console.log('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertTestToolConfig };