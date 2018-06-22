Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesWidgetBalage',{
	extend: 'Ext.panel.Panel',
	initComponent: function() {
		var balageGridFields = ['status_id','status_txt','status_color'],
				balageGridColumns = [{
					locked: true,
					width: 100,
					text: 'Statut',
					dataIndex: 'status_txt',
					renderer: function(value,metaData,record) {
						metaData.style += 'color: white ; background: '+record.get('status_color') ;
						return value ;
					},
					summaryType: 'sum',
					summaryRenderer: function(value) {
						return '<b>'+'Total'+'</b>' ;
					}
				}],
				balageRenderer = function(v) {
					if( v == 0 ) {
						return '' ;
					}
					return Ext.util.Format.number(v,'0,000') ;
				} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
				var balageField = 'inv_balage_'+balageSegmt.segmt_id ;

				balageGridColumns.push({
					text: balageSegmt.segmt_txt,
					dataIndex: balageField,
					width:95,
					align: 'right',
					renderer: balageRenderer,
					summaryType: 'sum',
					summaryRenderer: function(value) {
						return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
					}
				}) ;

				balageGridFields.push(balageField);
		}) ;
		if( true ) {
				var balageField = 'inv_balage_sum' ;
				balageGridFields.push(balageField);
				balageGridColumns.push({
					text: '<b>'+'Total'+'</b>',
					tdCls: 'op5-spec-dbstracy-boldcolumn',
					dataIndex: balageField,
					width:95,
					align: 'right',
					renderer: balageRenderer,
					summaryType: 'sum',
					summaryRenderer: function(value) {
						return '<b>'+Ext.util.Format.number(value,'0,000')+'</b>' ;
					}
				}) ;
		}

		Ext.apply(this, {
				xtype: 'panel',
				border: false,
				cls: 'chart-no-border',
				layout: 'fit',
				items: [{
					margin: '4px 10px',
					xtype: 'grid',
					itemId: 'gridStatusBalage',
					enableLocking: true,
					columns: {
						defaults: {
								menuDisabled: true,
								draggable: false,
								sortable: false,
								hideable: false,
								resizable: false,
								groupable: false,
								lockable: false,
								align: 'right'
						},
						items: balageGridColumns
					},
					store: {
						fields: balageGridFields,
						data: []
					},
					features: [{
						ftype: 'summary',
						dock: 'bottom'
					}]
				}]
		})
		this.callParent() ;
	},
	
	loadFilesData: function( ajaxData ){
		var map_status_arrBalage = {} ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			map_status_arrBalage[status.status_id]=[] ;
		}) ;
		Ext.Array.each( ajaxData, function(fileRow) {
			var status = fileRow.status ;
			if( !map_status_arrBalage.hasOwnProperty(status) ) {
					return ;
			}
			map_status_arrBalage[status].push(fileRow.inv_balage) ;
		}) ;
		var gridStatusBalageData = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getStatusAll(), function(status) {
			var gridStatusBalageRow = {
					'status_id' : status.status_id,
					'status_txt' : status.status_txt,
					'status_color' : status.status_color
			};
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
					var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
					gridStatusBalageRow[balageField] = 0 ;
			}) ;
			gridStatusBalageRow['inv_balage_sum'] = 0 ;
			Ext.Array.each( map_status_arrBalage[status.status_id], function(invBalage) {
					Ext.Object.each( invBalage, function(balageSegmtId,amount) {
						var balageField = 'inv_balage_'+balageSegmtId ;
						if( !gridStatusBalageRow.hasOwnProperty(balageField) ) {
							return ;
						}
						gridStatusBalageRow[balageField] += amount ;
						gridStatusBalageRow['inv_balage_sum'] += amount ;
					});
			}) ;
			gridStatusBalageData.push(gridStatusBalageRow) ;
		}) ;
		this.down('#gridStatusBalage').getStore().loadRawData(gridStatusBalageData) ;
	}
}) ;
