Ext.define('DbsEmbramachMachFlowEventRowModel', {
    extend: 'Ext.data.Model',
    fields: [
		{name: '_filerecord_id', type: 'int'},
		{name: 'event_date', type: 'date', dateFormat:'Y-m-d H:i:s'},
		{name: 'event_is_warning', type: 'boolean'},
		{name: 'event_code', type: 'string'},
		{name: 'event_txt', type: 'string'},
		{name: 'event_fields', type: 'auto'},
		{name: 'event_file_is_on', type: 'boolean'},
		{name: 'event_file_name', type: 'string'}
	]
});
Ext.define('Optima5.Modules.Spec.DbsEmbramach.MachHistoryPanel',{
	extend:'Ext.grid.Panel',
	
	initComponent: function() {
		Ext.apply( this, {
			frame: true,
			height: 300,
			columns: [{
				xtype: 'datecolumn',
				format: 'd/m/Y H:i',
				dataIndex: 'event_date',
				text: 'Date'
			},{
				width:24,
				dataIndex: 'event_is_warning',
				renderer: function(v,m) {
					if(v) {
						m.tdCls += ' op5-spec-dbsembramach-eventgrid-warning' ;
					} else {
						m.tdCls += ' op5-spec-dbsembramach-eventgrid-green' ;
					}
				}
			},{
				width: 90,
				dataIndex: 'event_code',
				text: 'Code',
				tdCls: 'op5-spec-dbsembramach-gridcell-boldtext'
			},{
				width: 150,
				dataIndex: 'event_txt',
				text: 'Desc',
				renderer: function(v,m,r) {
					if( !r.get('event_is_warning') ) {
						m.tdCls += ' op5-spec-dbsembramach-gridcell-italictext' ;
					}
					return v ;
				}
			},{
				text: 'Add. data',
				width: 150,
				variableRowHeight: true,
				renderer: function(v,m,r) {
					var fields = r.get('event_fields') ;
					if( Ext.isEmpty(fields) ) {
						return '&#160;' ;
					}
					var arrV = [] ;
					Ext.Array.each( fields, function(row) {
						if( row.name=='file_upload' ) {
							return ;
						}
						arrV.push( row.name + ' : <b>' + row.value + '</b>' );
					}) ;
					return arrV.join('<br>') ;
				}
			},{
				xtype: 'actioncolumn',
				width: 24,
				items: [{
					iconCls: 'op5-spec-dbsembramach-eventgrid-attach',
					
					handler : function(grid, rowIndex, colIndex) {
						var record = grid.getStore().getAt(rowIndex);
						if( record.get('event_file_is_on') ) {
							console.log('download') ;
							this.handleDownloadAttach( record.get('_filerecord_id'), record.get('event_file_name') ) ;
						}
					},
					scope : this,
					
					disabledCls: 'x-item-invisible',
					isDisabled: function(view,rowIndex,colIndex,item,record ) {
						if( record.get('event_file_is_on') ) {
							return false ;
						}
						return true ;
					}
				}]
			},{
				width: 125,
				dataIndex: 'event_file_name',
				text: 'Filename'
			}],
			store: {
				model: 'DbsEmbramachMachFlowEventRowModel',
				data:[],
				sorters: [{
					property: 'event_date',
					direction: 'DESC'
				}],
				proxy: {
					type: 'memory'
				}
			}
		});
		
		this.callParent() ;
		if( this.machRecord ) {
			var gridData = Ext.clone( this.machRecord.get('events') ) ;
			Ext.Array.each( gridData, function(row) {
				if( !row.event_fields ) {
					return ;
				}
				Ext.Array.each( row.event_fields, function(fieldRow) {
					if( fieldRow.name=='file_upload' ) {
						row.event_file_is_on = true ;
						row.event_file_name = fieldRow.value ;
						return false ;
					}
				}) ;
			});
			this.getStore().loadData( gridData ) ;
		}
	},
	handleDownloadAttach: function( eventFilerecordId, filename ) {
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_embramach',
				_action: 'mach_getEventBinary',
				flow_code: this.flowCode,
				filerecord_id: eventFilerecordId
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					return ;
				}
				this.doBinaryDownload( jsonResponse.binary_base64, filename ) ;
			},
			callback: function() {
				this.loadMask.destroy() ;
			},
			scope: this
		}) ;
	},
	
	doBinaryDownload: function(base64, filename ) {
			var binary_string = window.atob(base64);
			var len = binary_string.length;
			var bytes = new Uint8Array(len);
			for (var i = 0; i < len; i++) {
				bytes[i] = binary_string.charCodeAt(i);
			}
			var body = bytes.buffer;
		
		var blob = new Blob([body]);
		//var fileName = `${filename}.${extension}`;
		if (navigator.msSaveBlob) {
			// IE 10+
			navigator.msSaveBlob(blob, filename);
		} else {
			var link = document.createElement('a');
			// Browsers that support HTML5 download attribute
			if (link.download !== undefined) {
				var url = URL.createObjectURL(blob);
				link.setAttribute('href', url);
				link.setAttribute('download', filename);
				link.style.visibility = 'hidden';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	},
}) ;
