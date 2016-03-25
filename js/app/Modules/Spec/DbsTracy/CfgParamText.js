Ext.define('DbsTamCfgParamTextModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'text', type:'string'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsTracy.CfgParamText',{
	extend: 'Ext.form.field.ComboBox',
	alias: 'widget.op5specdbstracycfgparamtext',
	
	initComponent: function() {
		// => query HelperCache on current list cfgParam_id
		var helperData = Optima5.Modules.Spec.DbsTracy.HelperCache.getListData(this.cfgParam_id) ;
		if( helperData==null ) {
			Optima5.Helper.logError('DbsTracy:CfgParamText','No list data ?') ;
			helperData = [] ;
		}
		
		Ext.apply( this, {
			forceSelection:true,
			allowBlank:false,
			editable:true,
			typeAhead:true,
			selectOnFocus: true,
			selectOnTab: false,
			queryMode: 'local',
			displayField: 'text',
			valueField: 'id',
			fieldStyle: 'text-transform:uppercase',
			store: {
				model: 'DbsTamCfgParamTextModel',
				data: helperData
			}
		}) ;
		this.callParent() ;
	}
}) ;
