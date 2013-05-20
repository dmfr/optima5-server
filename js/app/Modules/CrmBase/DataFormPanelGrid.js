Ext.define('Optima5.Modules.CrmBase.DataFormPanelGrid',{
	extend : 'Ext.ux.dams.EmbeddedGrid',
	alias : 'widget.op5crmbasedataformpanelgrid',
	
	initComponent: function(){
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No module reference ?') ;
		}
		if( !me.transactionID ) {
			Optima5.Helper.logError('CrmBase:DataFormPanelGrid','No transaction ID ?') ;
		}
		
		me.callParent() ;
		
		me.linkstore.on('update',function(store,record){
			if( me.justUpdatedRecord !== record ){
				me.prettifyRecord( record ) ;
			}
		},me) ;
	},
	
	prettifyRecord: function(record) {
		var me = this ;
		if( !record )
			return ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action:'data_editTransaction',
				_subaction:'subfileData_prettify',
				_transaction_id : me.transactionID,
				subfile_code: me.itemId,
				data_record:Ext.JSON.encode(record.data)
			},
			success : function(response){
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					// console.dir(record) ;
					this.justUpdatedRecord = record ;
					Ext.Object.each( Ext.decode(response.responseText).data_record_add , function(mkey,mvalue) {
						record.set(mkey,mvalue) ;
					},this) ;
					this.justUpdatedRecord = null ;
				}
			},
			scope: this
		});
	}
});
