Ext.define('Optima5.Modules.Spec.DbsLam.GunContainersList',{
	extend:'Ext.grid.Panel',
	requires: [
		'Ext.grid.column.Action'
	],
	initComponent: function(){
		Ext.apply(this,{
			tbar: [{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'->',{
				itemId: 'tbAdd',
				iconCls: 'op5-spec-dbslam-transfer-add',
				text: '<b>Filters</b>',
				handler: function() {
					this.openFilters() ;
				},
				scope: this
			}],
			bbar : [{
				xtype:'textfield',
				itemId: 'txtScan',
				flex:1,
				listeners : {
					specialkey: function(field, e){
						if (e.getKey() == e.ENTER) {
							this.handleScan() ;
						}
					},
					scope: this
				}
			},{
				xtype:'button',
				text: 'Send',
				handler : function(button,event) {
					this.handleScan() ;
				},
				scope : this
			}],
			store: {
				model: 'DbsLamTransferLigModel',
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'transfer_getTransferLig'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				filters: [{
					property: 'container_ref',
					operator: '!=',
					value: ''
				},{
					property: 'status_is_ok',
					operator: '!=',
					value: true
				}],
				listeners: {
					beforeload: this.onGridBeforeLoad,
					load: this.onGridLoad,
					scope: this
				}
			},
			columns: [{
				xtype: 'actioncolumn',
				align: 'center',
				width: 36,
				items: [{
					icon: 'images/modules/crmbase-plugin-22.png',  // Use a URL in the icon config
					tooltip: 'Take',
					handler: function(grid, rowIndex, colIndex) {
						var rec = grid.getStore().getAt(rowIndex);
						this.openTransferLig( rec.get('transferlig_filerecord_id') ) ;
					},
					scope: this
				}]
			},{
				dataIndex: 'container_ref',
				text: 'Container',
			},{
				dataIndex: 'stk_prod',
				width: 150,
				text: 'P/N'
			},{
				dataIndex: 'src_adr',
				text: 'Pos.From'
			},{
				dataIndex: 'dst_adr',
				text: 'Pos.Dest'
			}]
		});
		this.callParent() ;
	},
	handleScan: function() {
		var containerRef = this.down('#txtScan').getValue() ;
		containerRef = containerRef.trim().toUpperCase() ;
		
		var transferligFilerecordId = null ;
		this.getStore().each( function(rec) {
			if( rec.get('container_ref') == containerRef ) {
				transferligFilerecordId = rec.get('transferlig_filerecord_id') ;
			}
		}) ;
		if( transferligFilerecordId ) {
			this.openTransferLig(transferligFilerecordId) ;
			return ;
		}
		this.getStore().load() ;
	},
	openTransferLig: function(transferligFilerecordId) {
		this.fireEvent('opentransferlig',this,transferligFilerecordId) ;
	},
	
	onGridBeforeLoad: function() {
		
	},
	onGridLoad: function() {
		this.down('#txtScan').focus() ;
	},
	
	openFilters: function() {
		this.fireEvent('openfilters',this) ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
}) ;
