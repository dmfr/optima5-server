Ext.define('Optima5.Modules.ParaCRM.DataFormPanelGrid',{
	extend : 'Ext.ux.dams.RestfulGrid',
	alias : 'widget.op5paracrmdataformpanelgrid',
	
	initComponent: function(){
		var me = this ;
		me.callParent() ;
		
		me.linkstore.on('update',function(store,record){
			if( me.justUpdatedRecord !== record ){
				me.prettifyRecord( record ) ;
			}
		},me) ;
	},
	
	prettifyRecord: function(record) {
		if( !record )
			return ;
		
		jsonDataEncode = Ext.JSON.encode(record.data);
		
		//jsonData = Ext.encode(Ext.pluck(this.linkstore.data.items, 'data'));
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, this.baseParams ) ;
		Ext.apply( ajaxParams, {_subaction:'subfileData_prettify'} ) ;
		Ext.apply( ajaxParams, {data_record:jsonDataEncode} ) ;
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams,
			succCallback : function(response){
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
	},
});
