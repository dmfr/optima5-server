Ext.define('Optima5.Modules.Spec.WbSales.TreePicker',{
	extend:'Ext.form.field.Picker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 

	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
			'{triggerEl}',
			'<div class="{clearCls}" role="presentation"></div>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : [] ,
	
	
	treeRoot: null,
	treeModel: '',
	
	initComponent: function() {
		var me = this ;
		
		this.mystore = Ext.create('Ext.data.TreeStore', {
			model: this.treeModel,
			root: Ext.clone(this.treeRoot),
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		});
		this.mystore.getRootNode().expand() ;
		
		this.on('afterrender',function() {
			this.setRawValueApplyPretty() ;
		},this) ;
		this.callParent() ;
	},
			
	expand: function() {
		var me = this ;
		this.callParent() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
	},
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.myValue ;
		me.myValue = record.getId() ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		me.applyPrettyValue(record) ;
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		
		var treepanel = Ext.create('Ext.tree.Panel', {
			store: this.mystore ,
			displayField: 'text',
			rootVisible: true,
			useArrows: true,
			height: 200,
			width: 200,
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me
		}) ;
		
		
		treepanel.getRootNode().cascadeBy(function(rec){
			if( Ext.Array.contains( me.myValue , rec.getId() ) ) {
				rec.set('checked',true) ;
			}
			else {
				rec.set('checked',false) ;
			}
		},this) ;
		
		treepanel.getView().on('checkchange',function(rec,check){
			if( !check ) {
				treepanel.getRootNode().cascadeBy(function(chrec){
					chrec.set('checked',false) ;
				},this);
			} else {
				treepanel.getRootNode().cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
			}
			
			me.onCheckChange() ;
		},this) ;
		
		return treepanel ;
	},
	alignPicker: function() {
		var me = this,
				picker;

		if (me.isExpanded) {
				picker = me.getPicker();
				if( me.pickerWidth ) {
					picker.setSize(me.pickerWidth);
				} else if (me.matchFieldWidth) {
					// Auto the height (it will be constrained by min and max width) unless there are no records to display.
					picker.setSize(me.bodyEl.getWidth());
				}
				if (picker.isFloating()) {
					me.doAlign();
				}
		}
	},
	onCheckChange : function() {
		var me = this ;
		
		oldRawValue = me.getRawValue() ;
		
		var checkedKeys = new Array() ;
		if( this.mystore ) {
			if( this.mystore.getRootNode().get('checked') ) {
				checkedKeys.push('') ;
			} else {
				this.mystore.getRootNode().cascadeBy(function(rec){
					if( rec.get('checked') == true ) {
						checkedKeys.push( rec.getId() ) ;
						return false ;
					}
				},this) ;
			}
		}
		me.myValue = checkedKeys[0] ;
		
		me.setRawValueApplyPretty() ;
		this.fireEvent('change',me,me.getRawValue(),oldRawValue) ;
	},
			  
			  
	setRawValue: function( mvalue ) {
		var me = this ;
		
		if( typeof mvalue === 'undefined' ) {
			return ;
		}
		if( me.getRawValue() == mvalue ) {
			return ;
		}
		
		var myNewValue = mvalue ;
		
		if( me.rendered ) {
			me.divtext.dom.innerHTML = '' ;
		}
		
		me.myValue = myNewValue ;
		
		me.setRawValueApplyPretty() ;
	},
		
	setRawValueApplyPretty: function() {
		var me = this ;
		
		var mvalue = me.myValue ;
		
		var record = this.mystore.getNodeById(mvalue) || this.mystore.getRootNode() ;
		if( record ) {
			me.divtext.dom.innerHTML = record.get('text') ;
			me.divicon.dom.style.background="url(" + record.get('icon') + ") no-repeat center center" ;
			return ;
		}
		return ;
	},
	getRawValue: function() {
		var me = this ;
		
		return me.myValue || '' ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	}  
});