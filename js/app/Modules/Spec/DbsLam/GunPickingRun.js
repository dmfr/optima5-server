Ext.define('Optima5.Modules.Spec.DbsLam.GunPickingRun',{
	extend:'Ext.panel.Panel',
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
			border: false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: '0px 8px',
				layout: 'anchor',
				fieldDefaults: {
					labelWidth: 120,
					anchor: '100%'
				},
				items: [{
					xtype: 'displayfield',
					name: 'need_txt',
					fieldLabel: 'Pick.Group',
					fieldStyle: 'font-weight:bold;'
				},{
					xtype: 'displayfield',
					name: 'dst_adr',
					fieldLabel: 'Dest.location',
					fieldStyle: 'font-weight:bold;'
				}]
			},{
				xtype: 'grid',
				flex: 1,
				store: {
					model: 'DbsLamTransferLigModel',
					data: [],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
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
					dataIndex: 'src_adr',
					text: 'Pos.From'
				},{
					dataIndex: 'stk_prod',
					width: 150,
					text: 'P/N'
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty'
				},{
					dataIndex: 'container_ref_display',
					text: 'Cont/Pal'
				}]
			}]
		});
		this.callParent() ;
		this.doLoadPickingDst( this._transferligDstAdr ) ;
	},
	openTransferLig: function(transferligFilerecordId) {
		this.fireEvent('opentransferlig',this,transferligFilerecordId) ;
	},
	
	doLoadPickingDst: function(filterDst) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferMission_getTransferLig'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText),
					transferligRecord = null ;
				if( !ajaxResponse.success ) {
					this.fireEvent('quit') ;
					return ;
				}
				this.onLoadPickingDst(ajaxResponse.data, filterDst) ;
			},
			scope: this
		}) ;
	},
	onLoadPickingDst: function(ajaxData, filterDst) {
		var formData = null ;
		var storeData = [] ;
		Ext.Array.each( ajaxData, function(row) {
			if( !Ext.isEmpty(row.container_ref) ) {
				return ;
			}
			if( row.status_is_ok ) {
				return ;
			}
			if( row.dst_adr != filterDst ) {
				return ;
			}
			storeData.push(row) ;
			
			if( !formData ) {
				formData = {
					need_txt: row.need_txt,
					dst_adr: row.dst_adr
				};
			}
		}) ;
		this.down('grid').getStore().loadData(storeData) ;
		this.down('form').getForm().setValues(formData) ;
		
		this.down('#txtScan').focus() ;
	},
	handleScan: function() {
		var srcAdr = this.down('#txtScan').getValue() ;
		srcAdr = srcAdr.trim().toUpperCase() ;
		
		var transferligFilerecordId = null ;
		this.getStore().each( function(rec) {
			if( rec.get('src_adr') == srcAdr ) {
				transferligFilerecordId = rec.get('transferlig_filerecord_id') ;
			}
		}) ;
		if( transferligFilerecordId ) {
			this.openTransferLig(transferligFilerecordId) ;
			return ;
		}
		this.doLoadPickingDst( this._transferligDstAdr ) ;
	},
	
	openFilters: function() {
		this.fireEvent('openfilters',this) ;
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
}) ;
