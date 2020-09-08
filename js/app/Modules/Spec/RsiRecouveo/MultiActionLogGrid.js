Ext.define('RsiRecouveoMultiActionLogsModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name:'filerecord_id', type:'integer'},
		{name: 'field_date', type: 'date', dateFormat:'Y-m-d H:i:s'},
		{name: "field_action", type: "string"},
		{name: "field_acc_name", type: "string"},
		{name: "field_user", type: "string"},
		{name: "field_fact_count", type: "integer"},
		{name: "field_amount", type: "integer"},
		{name: "field_detail", type: "string"},
	],
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.MultiActionLogGrid',{
	extend:'Ext.form.Panel',
	initComponent: function() {
		Ext.apply(this,{
			title: 'Historique des actions groupées',
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			itemId: "pGridPanel",
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: "grid",
				itemId: "pLogGrid",
				height: 530,
				width: 750,
				store: {
					model: 'RsiRecouveoMultiActionLogsModel',
					data: [],
					sorters: [{
						property: "field_date",
						direction: 'DESC'
					}],
					autoLoad: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'file_getMultiActionLogs'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
				},
				tbar: [{
					itemId: 'tbExport',
					iconCls: 'op5-spec-rsiveo-datatoolbar-file-export-excel',
					text: 'Export',
					handler: function() {
						this.handleMultiActionLogExport();
					},
					scope: this
				}],
				listeners: {
					celldblclick: function ( me, td, cellIndex, record, tr, rowIndex, e, eOpts ) {

						var arr = record.data.field_acc_name.split(", ") ;
						this.fireEvent('onLogItemDbClick',arr) ;
					},
					scope: this
				},
				columns: [
					// {
					// 	text: 'Id',
					// 	dataIndex: 'filerecord_id',
					// 	width: 50
					// },
					{
						text: 'Date',
						dataIndex: 'field_date',
						renderer: Ext.util.Format.dateRenderer('d/m/Y H:i'),
						width: 150
					},
					{
						text: "Type d'action",
						dataIndex: 'field_action',
						width: 300
					},
					{
						text: "Détail de l'action",
						dataIndex: 'field_detail',
						width: 300
					},
					{
						text: "Comptes associés",
						dataIndex: 'field_acc_name',
						width: 300
					},
					{
						text: "Utilisateur",
						dataIndex: 'field_user',
						width: 100
					},
					{
						text: "Factures",
						dataIndex: 'field_fact_count',
						width: 100
					},
					{
						text: "Montant (€)",
						dataIndex: 'field_amount',
						width: 100,
						renderer: function(v,m,r) {
							var txt = '' ;
							txt += '<div>'+Ext.util.Format.number(v,'0,000')+'&nbsp;€'+'</div>' ;
							return txt ;
						}
					}
				]
			}]
		}) ;
		this.callParent() ;
	},

	handleMultiActionLogExport: function() {
		var mapFieldString = {} ;
		var grid = this.down('#pLogGrid') ;
		Ext.Array.each( grid.getStore().getModel().getFields(), function(field) {
			mapFieldString[field.getName()] = Ext.Array.contains(['string'],field.getType()) ;
		}) ;
		var columns = [] ;
		var columnsKeys = [] ;
		Ext.Array.each( grid.headerCt.getGridColumns(), function(column) {
			var dataIndex = column.dataIndex
			columns.push({
				dataIndex: dataIndex,
				dataIndexString: mapFieldString[dataIndex],
				text: column.text
			});
			columnsKeys.push( dataIndex ) ;
		});

		var data = [] ;
		grid.getStore().each( function(record) {
			var recData = record.getData(true) ;

			var exportData = {} ;
			Ext.Array.each( columnsKeys, function(k){
				exportData[k] = recData[k] ;
			}) ;
			data.push( exportData ) ;
		}) ;

		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_rsi_recouveo',
			_action: 'xls_create',
			columns: Ext.JSON.encode(columns),
			data: Ext.JSON.encode(data),
			exportXls: true
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},

	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},

}) ;
